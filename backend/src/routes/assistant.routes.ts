import { Router } from "express";
import { askAirAssistant } from "../controllers/assistant.controller.js";

const router = Router();

// POST /api/assistant/chat
router.post("/chat", askAirAssistant);

export default router;
