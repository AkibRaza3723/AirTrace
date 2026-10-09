import {
  ActivityMode,
  LocationType,
  ExposureCalculationParams,
  ExposureCalculationResult,
} from "../types/index.js";

const ACTIVITY_FACTORS: Record<ActivityMode, number> = {
  sedentary: 1.0,
  transit: 1.5,
  walking: 1.5,
  biking: 2.75, // 2.5 - 3.0 range
};

const LOCATION_FACTORS: Record<LocationType, number> = {
  suburban: 0.85,
  urban: 1.0,
  highway: 1.4, // 1.3 - 1.5 range
};

/**
 * Calculates estimated personal exposure index based on BUILD_SPEC.md formulation:
 * Exposure Index = (PM2.5 / 25) * Duration (hours) * ActivityFactor * LocationFactor
 */
export function calculateExposureScore(
  params: ExposureCalculationParams
): ExposureCalculationResult {
  const { pm25, durationHours, activityMode, locationType } = params;

  const normalizedPm25 = Math.max(0, pm25) / 25; // WHO 24-hour guideline reference = 25 ug/m3
  const activityFactor = ACTIVITY_FACTORS[activityMode] ?? 1.0;
  const locationFactor = LOCATION_FACTORS[locationType] ?? 1.0;

  const rawScore = normalizedPm25 * durationHours * activityFactor * locationFactor;
  const exposureScore = parseFloat(rawScore.toFixed(2));

  let category: ExposureCalculationResult["category"] = "Low";
  const recommendations: string[] = [];

  if (exposureScore <= 1.0) {
    category = "Low";
    recommendations.push("Exposure within healthy baseline limits.");
  } else if (exposureScore <= 2.5) {
    category = "Moderate";
    recommendations.push("Acceptable for general activity; sensitive individuals may consider moderate pacing.");
  } else if (exposureScore <= 5.0) {
    category = "Elevated";
    recommendations.push("Consider reducing high-intensity outdoor activities.");
    recommendations.push("Opt for cleaner secondary routes where possible.");
  } else if (exposureScore <= 10.0) {
    category = "High";
    recommendations.push("Wear an N95/FFP2 mask for prolonged outdoor transit.");
    recommendations.push("Limit outdoor exercise duration.");
  } else {
    category = "Hazardous";
    recommendations.push("High health risk. Remain indoors with filtered ventilation.");
    recommendations.push("Avoid outdoor strenuous activity entirely.");
  }

  return {
    exposureScore,
    category,
    pm25Normalized: parseFloat(normalizedPm25.toFixed(2)),
    activityFactor,
    locationFactor,
    recommendations,
  };
}
