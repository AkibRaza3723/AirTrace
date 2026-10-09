import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { requireAuthMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Mount all standard Better Auth handlers (signup, signin, google oauth, session, signout)
// These respond to /api/auth/* (e.g. /api/auth/sign-in/email, /api/auth/sign-in/social, /api/auth/get-session)
router.all("/auth/*", toNodeHandler(auth));

// Helper endpoint to fetch current authenticated user profile
router.get("/auth/me", requireAuthMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      session: req.session,
    },
  });
});

export default router;
