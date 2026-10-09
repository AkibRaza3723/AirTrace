import { Request, Response } from "express";
import { z } from "zod";
import { calculateExposureScore } from "../services/exposure.service.js";
import { sendSuccess } from "../utils/response.js";

export const exposureSchema = z.object({
  pm25: z.number().min(0, "PM2.5 must be positive"),
  durationHours: z.number().positive("Duration must be greater than 0"),
  activityMode: z.enum(["sedentary", "walking", "biking", "transit"]),
  locationType: z.enum(["suburban", "urban", "highway"]),
});

export async function handleCalculateExposure(req: Request, res: Response) {
  const params = exposureSchema.parse(req.body);
  const result = calculateExposureScore(params);
  return sendSuccess(res, result, "Exposure calculated successfully");
}
