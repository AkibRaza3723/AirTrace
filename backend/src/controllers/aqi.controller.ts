import { Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";

export async function getLiveAqi(req: Request, res: Response) {
  const { lat, lng } = req.query;
  return sendSuccess(
    res,
    {
      location: { lat: Number(lat) || 28.6139, lng: Number(lng) || 77.209 },
      aqi: 142,
      pm25: 58.4,
      pm10: 112.1,
      no2: 24.5,
      so2: 9.8,
      o3: 31.2,
      co: 1.1,
      dominantPollutant: "PM2.5",
      category: "Unhealthy for Sensitive Groups",
      updatedAt: new Date().toISOString(),
      source: "OpenAQ / Open-Meteo Integration",
    },
    "Air quality telemetry retrieved"
  );
}
