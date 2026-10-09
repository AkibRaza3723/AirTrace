import { Router } from "express";
import { handleCalculateExposure } from "../controllers/exposure.controller.js";

const router = Router();

router.post("/calculate", handleCalculateExposure);

export default router;
