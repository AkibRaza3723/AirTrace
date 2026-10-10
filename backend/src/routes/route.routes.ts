import { Router } from "express";
import { planRoute, geocodeSearch } from "../controllers/route.controller.js";

const router = Router();

// POST /api/routes/plan — Plan routes between origin/destination with air quality sampling
router.post("/plan", planRoute);

// GET /api/routes/geocode — Search/geocode a location string
router.get("/geocode", geocodeSearch);

export default router;
