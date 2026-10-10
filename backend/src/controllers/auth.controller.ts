import { Request, Response } from "express";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/dbconnect.js";
import { logger } from "../utils/logger.js";

// ─── Rate Limiter for Login ──────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return true;
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.delete(ip);
    return true;
  }
  return record.count < MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

// ─── Input Validation Schemas ────────────────────────────────────────

const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long"),
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address")
      .transform((val) => val.toLowerCase()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)/,
        "Password must contain at least one letter and one number"
      ),
    confirmPassword: z.string(),
    profession: z.enum(["STUDENT", "PROFESSIONAL"], {
      errorMap: () => ({
        message: "Profession must be either STUDENT or PROFESSIONAL",
      }),
    }),
    // Student-specific fields
    campusName: z.string().trim().optional(),
    campusLatitude: z.number().min(-90).max(90).optional(),
    campusLongitude: z.number().min(-180).max(180).optional(),
    campusAddress: z.string().trim().optional(),
    // Professional-specific fields (optional)
    preferredAddress: z.string().trim().optional(),
    preferredLat: z.number().min(-90).max(90).optional(),
    preferredLng: z.number().min(-180).max(180).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .transform((val) => val.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

const campusProfileSchema = z.object({
  campusName: z.string().trim().min(2, "Campus name is required"),
  campusLatitude: z
    .number({ required_error: "Campus latitude is required" })
    .min(-90)
    .max(90),
  campusLongitude: z
    .number({ required_error: "Campus longitude is required" })
    .min(-180)
    .max(180),
  campusAddress: z.string().trim().optional().nullable(),
});

const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  preferredAddress: z.string().trim().optional().nullable(),
  preferredLat: z.number().min(-90).max(90).optional().nullable(),
  preferredLng: z.number().min(-180).max(180).optional().nullable(),
});

// ─── Controllers ─────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 */
export async function signup(req: Request, res: Response) {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Validation failed";
      return res.status(400).json({
        success: false,
        error: firstError,
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    // Student validation rules
    if (data.profession === "STUDENT") {
      if (!data.campusName || data.campusLatitude === undefined || data.campusLongitude === undefined) {
        return res.status(400).json({
          success: false,
          error: "Campus name and geographical location are required for student accounts.",
        });
      }
    }

    // Professional validation rules
    if (data.profession === "PROFESSIONAL") {
      if (data.campusName || data.campusLatitude !== undefined || data.campusLongitude !== undefined) {
        return res.status(400).json({
          success: false,
          error: "Campus information must not be provided for professional accounts.",
        });
      }
    }

    // Check if account already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "An account with this email address already exists. Please log in instead.",
      });
    }

    // Create user via Better Auth
    const isStudentOnboardingDone = Boolean(data.campusName && data.campusLatitude !== undefined);
    const authRes = await auth.api.signUpEmail({
      body: {
        name: data.fullName,
        email: data.email,
        password: data.password,
        profession: data.profession,
        onboardingCompleted: data.profession === "PROFESSIONAL" || isStudentOnboardingDone,
        preferredAddress: data.preferredAddress || undefined,
        preferredLat: data.preferredLat || undefined,
        preferredLng: data.preferredLng || undefined,
      },
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    if (!authRes.ok) {
      const errBody = await authRes.json().catch(() => ({}));
      logger.error("Better Auth signup error:", errBody);
      return res.status(authRes.status || 400).json({
        success: false,
        error: errBody.message || "Failed to create account. Please try again.",
      });
    }

    // Copy Set-Cookie headers to express response
    const setCookieHeaders = authRes.headers.getSetCookie?.() || [authRes.headers.get("set-cookie")].filter(Boolean);
    for (const cookie of setCookieHeaders) {
      if (cookie) res.append("Set-Cookie", cookie);
    }

    const authData = await authRes.json();
    const createdUser = authData.user;

    // Save Student CampusProfile if student
    let savedCampusProfile = null;
    if (data.profession === "STUDENT" && createdUser?.id) {
      savedCampusProfile = await prisma.campusProfile.create({
        data: {
          userId: createdUser.id,
          campusName: data.campusName!,
          campusLatitude: data.campusLatitude!,
          campusLongitude: data.campusLongitude!,
          campusAddress: data.campusAddress || null,
        },
      });
    }

    logger.info(`User registered successfully: ${data.email} (${data.profession})`);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        profession: data.profession,
        onboardingCompleted: data.profession === "PROFESSIONAL" || isStudentOnboardingDone,
        preferredAddress: data.preferredAddress || null,
        campusProfile: savedCampusProfile,
      },
      redirectTo: data.profession === "STUDENT" && !isStudentOnboardingDone ? "/onboarding" : "/dashboard",
    });
  } catch (error: any) {
    logger.error("Signup internal error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error occurred during registration. Please try again later.",
    });
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response) {
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: "Too many failed login attempts. Please wait 15 minutes before trying again.",
    });
  }

  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0]?.message || "Invalid email or password format",
      });
    }

    const { email, password } = parseResult.data;

    const authRes = await auth.api.signInEmail({
      body: { email, password },
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    if (!authRes.ok) {
      recordFailedAttempt(clientIp);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password. Please check your credentials.",
      });
    }

    clearRateLimit(clientIp);

    // Forward Set-Cookie header
    const setCookieHeaders = authRes.headers.getSetCookie?.() || [authRes.headers.get("set-cookie")].filter(Boolean);
    for (const cookie of setCookieHeaders) {
      if (cookie) res.append("Set-Cookie", cookie);
    }

    const authData = await authRes.json();
    const loggedInUser = authData.user;

    // Fetch user details and campus profile
    const dbUser = await prisma.user.findUnique({
      where: { id: loggedInUser.id },
      include: { campusProfile: true },
    });

    const isStudentIncomplete =
      dbUser?.profession === "STUDENT" && (!dbUser.onboardingCompleted || !dbUser.campusProfile);

    logger.info(`User logged in: ${email}`);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: {
        id: dbUser?.id || loggedInUser.id,
        name: dbUser?.name || loggedInUser.name,
        email: dbUser?.email || loggedInUser.email,
        profession: dbUser?.profession || "STUDENT",
        onboardingCompleted: dbUser?.onboardingCompleted ?? false,
        preferredAddress: dbUser?.preferredAddress || null,
        preferredLat: dbUser?.preferredLat || null,
        preferredLng: dbUser?.preferredLng || null,
        campusProfile: dbUser?.campusProfile || null,
      },
      redirectTo: isStudentIncomplete ? "/onboarding" : "/dashboard",
    });
  } catch (error: any) {
    logger.error("Login internal error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication service error. Please try again later.",
    });
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response) {
  try {
    const authRes = await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    // Forward cookie invalidation headers
    const setCookieHeaders = authRes.headers.getSetCookie?.() || [authRes.headers.get("set-cookie")].filter(Boolean);
    for (const cookie of setCookieHeaders) {
      if (cookie) res.append("Set-Cookie", cookie);
    }

    res.clearCookie("better-auth.session_token", { path: "/" });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
      redirectTo: "/auth",
    });
  } catch (error: any) {
    logger.error("Logout error:", error);
    res.clearCookie("better-auth.session_token", { path: "/" });
    return res.status(200).json({
      success: true,
      message: "Session ended.",
      redirectTo: "/auth",
    });
  }
}

/**
 * GET /api/auth/session (and /api/auth/me)
 */
export async function getSession(req: Request, res: Response) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(200).json({
        success: false,
        authenticated: false,
        user: null,
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { campusProfile: true },
    });

    if (!dbUser) {
      return res.status(200).json({
        success: false,
        authenticated: false,
        user: null,
      });
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        profession: dbUser.profession,
        onboardingCompleted: dbUser.onboardingCompleted,
        preferredAddress: dbUser.preferredAddress || null,
        preferredLat: dbUser.preferredLat || null,
        preferredLng: dbUser.preferredLng || null,
        campusProfile: dbUser.campusProfile || null,
        createdAt: dbUser.createdAt,
      },
    });
  } catch (error: any) {
    logger.error("Session fetch error:", error);
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: "Failed to retrieve session.",
    });
  }
}

/**
 * PATCH /api/profile
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Active session required.",
      });
    }

    // Forbid profession changes via API
    if ("profession" in req.body) {
      return res.status(400).json({
        success: false,
        error: "Account profession cannot be modified after registration.",
      });
    }

    const parseResult = profileUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0]?.message || "Invalid update data",
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: parseResult.data,
      include: { campusProfile: true },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        profession: updated.profession,
        onboardingCompleted: updated.onboardingCompleted,
        preferredAddress: updated.preferredAddress,
        preferredLat: updated.preferredLat,
        preferredLng: updated.preferredLng,
        campusProfile: updated.campusProfile,
      },
    });
  } catch (error: any) {
    logger.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update profile.",
    });
  }
}

/**
 * PATCH /api/profile/campus
 */
export async function updateCampusProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Active session required.",
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (dbUser.profession !== "STUDENT") {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Campus profiles are only applicable to student accounts.",
      });
    }

    const parseResult = campusProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0]?.message || "Invalid campus data",
      });
    }

    const { campusName, campusLatitude, campusLongitude, campusAddress } = parseResult.data;

    // Upsert campus profile & mark onboarding complete
    const [campus, updatedUser] = await prisma.$transaction([
      prisma.campusProfile.upsert({
        where: { userId },
        create: {
          userId,
          campusName,
          campusLatitude,
          campusLongitude,
          campusAddress: campusAddress || null,
        },
        update: {
          campusName,
          campusLatitude,
          campusLongitude,
          campusAddress: campusAddress || null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Campus profile saved and onboarding completed.",
      campusProfile: campus,
      onboardingCompleted: updatedUser.onboardingCompleted,
      redirectTo: "/dashboard",
    });
  } catch (error: any) {
    logger.error("Update campus profile error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to save campus profile.",
    });
  }
}

/**
 * GET /api/profile/campus
 */
export async function getCampusProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const campus = await prisma.campusProfile.findUnique({
      where: { userId },
    });

    return res.status(200).json({
      success: true,
      campusProfile: campus,
    });
  } catch (error: any) {
    logger.error("Get campus profile error:", error);
    return res.status(500).json({ success: false, error: "Failed to retrieve campus profile." });
  }
}
