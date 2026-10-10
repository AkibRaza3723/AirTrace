import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { requireAuthMiddleware } from "../middleware/auth.middleware.js";
import {
  signup,
  login,
  logout,
  getSession,
  updateProfile,
  updateCampusProfile,
  getCampusProfile,
} from "../controllers/auth.controller.js";

const router = Router();

// ─── Direct Authentication Endpoints ─────────────────────────────────
router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/session", getSession);
router.get("/auth/me", getSession);

// ─── Profile & Campus Endpoints ──────────────────────────────────────
router.patch("/profile", requireAuthMiddleware, updateProfile);
router.patch("/profile/campus", requireAuthMiddleware, updateCampusProfile);
router.get("/profile/campus", requireAuthMiddleware, getCampusProfile);

// ─── Better Auth Native Handlers ─────────────────────────────────────
// Handles /api/auth/sign-in/email, /api/auth/sign-up/email, /api/auth/get-session, etc.
// In Express 5 (path-to-regexp v8), wildcards must have a parameter name (e.g. *path)
router.all(["/auth", "/auth/*path"], toNodeHandler(auth));

export default router;
