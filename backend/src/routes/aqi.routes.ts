import { Router } from "express";
import { getLiveAqi } from "../controllers/aqi.controller.js";

const router = Router();

router.get("/live", getLiveAqi);

export default router;
