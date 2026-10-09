import { Router } from "express";
import authRoutes from "./auth.routes.js";
import exposureRoutes from "./exposure.routes.js";
import aqiRoutes from "./aqi.routes.js";

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

// AirTrace Exposure routes (/api/exposure/*)
apiRouter.use("/exposure", exposureRoutes);

// Live AQI Telemetry routes (/api/aqi/*)
apiRouter.use("/aqi", aqiRoutes);

export default apiRouter;
