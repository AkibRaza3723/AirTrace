import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// Schema for testing registration validation
const testSignupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100),
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
    profession: z.enum(["STUDENT", "PROFESSIONAL"]),
    campusName: z.string().trim().optional(),
    campusLatitude: z.number().min(-90).max(90).optional(),
    campusLongitude: z.number().min(-180).max(180).optional(),
    campusAddress: z.string().trim().optional(),
    preferredAddress: z.string().trim().optional(),
    preferredLat: z.number().min(-90).max(90).optional(),
    preferredLng: z.number().min(-180).max(180).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function validateRegistrationInput(input: any): { valid: boolean; error?: string } {
  const result = testSignupSchema.safeParse(input);
  if (!result.success) {
    return { valid: false, error: result.error.errors[0]?.message };
  }

  const data = result.data;
  if (data.profession === "STUDENT") {
    if (!data.campusName || data.campusLatitude === undefined || data.campusLongitude === undefined) {
      return {
        valid: false,
        error: "Campus name and geographical location are required for student accounts.",
      };
    }
  }

  if (data.profession === "PROFESSIONAL") {
    if (data.campusName || data.campusLatitude !== undefined || data.campusLongitude !== undefined) {
      return {
        valid: false,
        error: "Campus information must not be provided for professional accounts.",
      };
    }
  }

  return { valid: true };
}

test("BreatheWise Authentication & Onboarding Test Suite", async (t) => {
  // 1. Valid Student Registration
  await t.test("Accepts valid student registration with campus coordinates", () => {
    const res = validateRegistrationInput({
      fullName: "Omkar Sharma",
      email: "omkar@campus.edu",
      password: "Password123",
      confirmPassword: "Password123",
      profession: "STUDENT",
      campusName: "IIT Delhi",
      campusLatitude: 28.545,
      campusLongitude: 77.1926,
      campusAddress: "Hauz Khas, New Delhi",
    });
    assert.equal(res.valid, true);
  });

  // 2. Valid Professional Registration
  await t.test("Accepts valid professional registration without campus fields", () => {
    const res = validateRegistrationInput({
      fullName: "Dr. Sarah Chen",
      email: "sarah@airquality.org",
      password: "SecurePass2026",
      confirmPassword: "SecurePass2026",
      profession: "PROFESSIONAL",
      preferredAddress: "Connaught Place, New Delhi",
      preferredLat: 28.6315,
      preferredLng: 77.2167,
    });
    assert.equal(res.valid, true);
  });

  // 3. Rejects Missing Required Fields
  await t.test("Rejects missing full name", () => {
    const res = validateRegistrationInput({
      fullName: "",
      email: "test@example.com",
      password: "Password123",
      confirmPassword: "Password123",
      profession: "PROFESSIONAL",
    });
    assert.equal(res.valid, false);
    assert.match(res.error || "", /Full name/);
  });

  // 4. Rejects Invalid Email
  await t.test("Rejects invalid email format", () => {
    const res = validateRegistrationInput({
      fullName: "Alex Morgan",
      email: "not-an-email",
      password: "Password123",
      confirmPassword: "Password123",
      profession: "STUDENT",
      campusName: "DTU",
      campusLatitude: 28.75,
      campusLongitude: 77.11,
    });
    assert.equal(res.valid, false);
    assert.match(res.error || "", /valid email/);
  });

  // 5. Rejects Weak Password (no number or short)
  await t.test("Rejects weak password without number", () => {
    const res = validateRegistrationInput({
      fullName: "Alex Morgan",
      email: "alex@dtu.ac.in",
      password: "weakpassword",
      confirmPassword: "weakpassword",
      profession: "PROFESSIONAL",
    });
    assert.equal(res.valid, false);
    assert.match(res.error || "", /letter and one number/);
  });

  // 6. Rejects Password Confirmation Mismatch
  await t.test("Rejects password mismatch", () => {
    const res = validateRegistrationInput({
      fullName: "Alex Morgan",
      email: "alex@dtu.ac.in",
      password: "Password123",
      confirmPassword: "DifferentPassword123",
      profession: "PROFESSIONAL",
    });
    assert.equal(res.valid, false);
    assert.match(res.error || "", /Passwords do not match/);
  });

  // 7. Student without Campus Details is Rejected
  await t.test("Rejects student registration missing campus information", () => {
    const res = validateRegistrationInput({
      fullName: "Alex Morgan",
      email: "alex@dtu.ac.in",
      password: "Password123",
      confirmPassword: "Password123",
      profession: "STUDENT",
    });
    assert.equal(res.valid, false);
    assert.match(res.error || "", /Campus name and geographical location are required/);
  });

  // 8. Professional with Campus Details is Rejected
  await t.test("Rejects professional registration containing campus fields", () => {
    const res = validateRegistrationInput({
      fullName: "Dr. Sarah Chen",
      email: "sarah@pro.org",
      password: "Password123",
      confirmPassword: "Password123",
      profession: "PROFESSIONAL",
      campusName: "Illegal Campus Input",
      campusLatitude: 28.5,
      campusLongitude: 77.2,
    });
    assert.equal(res.valid, false);
    assert.match(res.error || "", /Campus information must not be provided/);
  });

  // 9. Normalized Email Lowercasing
  await t.test("Normalizes mixed-case email addresses consistently", () => {
    const parsed = testSignupSchema.parse({
      fullName: "Omkar",
      email: "OMKAR.SHARMA@CAMPUS.EDU",
      password: "Password123",
      confirmPassword: "Password123",
      profession: "PROFESSIONAL",
    });
    assert.equal(parsed.email, "omkar.sharma@campus.edu");
  });

  // 10. Student Onboarding & Access Policy Check
  await t.test("Verifies student access policy based on onboarding status", () => {
    const pendingStudent = { profession: "STUDENT", onboardingCompleted: false, campusProfile: null };
    const completedStudent = {
      profession: "STUDENT",
      onboardingCompleted: true,
      campusProfile: { campusName: "IIT Delhi", lat: 28.545, lng: 77.1926 },
    };
    const professional = { profession: "PROFESSIONAL", onboardingCompleted: false, campusProfile: null };

    // Function simulating RouteGuard decision
    function getRedirect(user: any, targetPath: string): string | null {
      if (!user) return "/login";
      if (user.profession === "STUDENT" && !user.onboardingCompleted) {
        return targetPath === "/onboarding" ? null : "/onboarding";
      }
      return null;
    }

    assert.equal(getRedirect(pendingStudent, "/dashboard"), "/onboarding");
    assert.equal(getRedirect(pendingStudent, "/onboarding"), null);
    assert.equal(getRedirect(completedStudent, "/dashboard"), null);
    assert.equal(getRedirect(professional, "/dashboard"), null);
  });
});
