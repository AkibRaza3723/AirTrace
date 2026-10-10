import { Router } from "express";
import authRoutes from "./auth.routes.js";
import aqiRoutes from "./aqi.routes.js";
import assistantRoutes from "./assistant.routes.js";
import campusRoutes from "./campus.routes.js";

const apiRouter = Router();

// Health check endpoint
apiRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AirTrace API",
    timestamp: new Date().toISOString(),
  });
});

// Better Auth routes (/api/auth/*)
apiRouter.use(authRoutes);

// Live AQI Telemetry routes (/api/aqi/*)
apiRouter.use("/aqi", aqiRoutes);

// AI Air Advisor routes (/api/assistant/*)
apiRouter.use("/assistant", assistantRoutes);

// Campus Decision System routes (/api/campus/*)
apiRouter.use("/campus", campusRoutes);

export default apiRouter;

