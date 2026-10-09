import { Router } from "express";
import { getLiveAqi, getDelhiStations } from "../controllers/aqi.controller.js";

const router = Router();

router.get("/live", getLiveAqi);
router.get("/stations", getDelhiStations);

export default router;
