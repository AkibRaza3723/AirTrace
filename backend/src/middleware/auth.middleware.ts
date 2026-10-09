import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";

// Extend Express Request type to include user & session
declare global {
  namespace Express {
    interface Request {
      user?: typeof auth.$Infer.Session.user | null;
      session?: typeof auth.$Infer.Session.session | null;
    }
  }
}

/**
 * Middleware that populates req.user and req.session if a valid session exists.
 * Does NOT block requests if unauthenticated.
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      req.user = session.user;
      req.session = session.session;
    } else {
      req.user = null;
      req.session = null;
    }
    next();
  } catch (error) {
    req.user = null;
    req.session = null;
    next();
  }
}

/**
 * Middleware that requires an authenticated user session.
 * Rejects with 401 Unauthorized if not logged in.
 */
export async function requireAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: You must be logged in to access this resource.",
      });
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Failed to authenticate session.",
    });
  }
}
