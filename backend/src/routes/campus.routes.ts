import { Router } from "express";
import {
  getCampusAirQuality,
  evaluateCampusDecision,
  explainCampusDecision,
  getCampusZones,
} from "../controllers/campus.controller.js";

const router = Router();

// GET /api/campus/air-quality - Retrieves live CPCB NAQI and Open-Meteo forecasts for campus
router.get("/air-quality", getCampusAirQuality);

// POST /api/campus/decision - Runs the deterministic decision engine for outdoor activities
router.post("/decision", evaluateCampusDecision);

// POST /api/campus/explain - Generates grounded AWS Bedrock / fallback plain-language decision explanation
router.post("/explain", explainCampusDecision);

// GET /api/campus/zones - Multi-zone campus spatial comparison with physical vs estimate flags
router.get("/zones", getCampusZones);

export default router;
