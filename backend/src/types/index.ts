export type ActivityMode = "sedentary" | "walking" | "biking" | "transit";
export type LocationType = "suburban" | "urban" | "highway";

export interface ExposureCalculationParams {
  pm25: number;
  durationHours: number;
  activityMode: ActivityMode;
  locationType: LocationType;
}

export interface ExposureCalculationResult {
  exposureScore: number;
  category: "Low" | "Moderate" | "Elevated" | "High" | "Hazardous";
  pm25Normalized: number;
  activityFactor: number;
  locationFactor: number;
  recommendations: string[];
}

export interface RouteExposureComparisonRequest {
  origin: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name?: string };
  activityMode: ActivityMode;
}
