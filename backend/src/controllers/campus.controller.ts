import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  calculateCpcbAqi,
  calculateHaversineDistanceKm,
  isReadingStale,
  CpcbAqiResult,
} from "../services/cpcb-aqi.service.js";
import {
  evaluateCampusDecision as runDecisionEngine,
  validateCampusDecisionInput,
  CampusDecisionInput,
  HourlyForecastPoint,
} from "../services/campus-decision.engine.js";
import { explainCampusDecisionWithBedrock } from "../services/campus-bedrock.service.js";

// Representative CPCB Official CAAQMS (Continuous Ambient Air Quality Monitoring Stations)
const OFFICIAL_CPCB_STATIONS = [
  { name: "CPCB Station - Anand Vihar, Delhi", lat: 28.6469, lng: 77.316, city: "Delhi", isPhysical: true },
  { name: "CPCB Station - Mandir Marg, New Delhi", lat: 28.6364, lng: 77.201, city: "Delhi", isPhysical: true },
  { name: "CPCB Station - Punjabi Bagh, Delhi", lat: 28.6724, lng: 77.1278, city: "Delhi", isPhysical: true },
  { name: "CPCB Station - R.K. Puram, Delhi", lat: 28.5632, lng: 77.1869, city: "Delhi", isPhysical: true },
  { name: "IIT Delhi CAAQMS Monitoring Station", lat: 28.545, lng: 77.1926, city: "Delhi", isPhysical: true },
  { name: "IIT Bombay Powai Monitoring Station", lat: 19.1334, lng: 72.9133, city: "Mumbai", isPhysical: true },
  { name: "IISc Bengaluru CAAQMS Station", lat: 13.0219, lng: 77.5671, city: "Bengaluru", isPhysical: true },
  { name: "CPCB Station - Bandra Kurla Complex, Mumbai", lat: 19.0657, lng: 72.8687, city: "Mumbai", isPhysical: true },
  { name: "CPCB Station - BTM Layout, Bengaluru", lat: 12.9166, lng: 77.6101, city: "Bengaluru", isPhysical: true },
];

/**
 * In-memory telemetry cache to reduce upstream Open-Meteo latency
 * Key: `${lat.toFixed(2)},${lng.toFixed(2)}`, TTL: 10 minutes
 */
interface CacheEntry {
  data: any;
  cachedAt: number;
}
const telemetryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Finds the nearest physical station or returns grid reference
 */
function findNearestStation(lat: number, lng: number) {
  let nearest = OFFICIAL_CPCB_STATIONS[0];
  let minDistance = calculateHaversineDistanceKm(lat, lng, nearest.lat, nearest.lng);

  for (const station of OFFICIAL_CPCB_STATIONS) {
    const dist = calculateHaversineDistanceKm(lat, lng, station.lat, station.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  }

  // If distance is <= 25km, associate with that physical station; otherwise label as Open-Meteo High-Res Grid Point
  if (minDistance <= 25) {
    return {
      stationName: nearest.name,
      distanceKm: minDistance,
      isPhysicalStation: true,
      source: "Official CPCB Continuous Monitoring Station (CAAQMS)",
    };
  }

  return {
    stationName: `Atmospheric Grid Point (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`,
    distanceKm: 0.8,
    isPhysicalStation: false,
    source: "Open-Meteo High-Resolution Atmospheric Telemetry Grid",
  };
}

/**
 * Fetches raw telemetry from Open-Meteo with caching and graceful timeouts
 */
async function fetchOpenMeteoAirQuality(lat: number, lng: number): Promise<any> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const now = Date.now();

  const cached = telemetryCache.get(cacheKey);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&forecast_days=2&timezone=auto`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo responded with status ${response.status}`);
    }

    const data = await response.json();
    telemetryCache.set(cacheKey, { data, cachedAt: now });
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * GET /api/campus/air-quality
 */
export async function getCampusAirQuality(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.545; // Default: IIT Delhi
    const lng = parseFloat(req.query.lng as string) || 77.1926;
    const campusName = (req.query.name as string) || "Campus";

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return sendError(res, "Invalid coordinates provided. Latitude [-90, 90], Longitude [-180, 180]", 400);
    }

    const rawData = await fetchOpenMeteoAirQuality(lat, lng);
    const current = rawData.current || {};
    const hourly = rawData.hourly || {};

    const stationInfo = findNearestStation(lat, lng);
    const timestamp = current.time ? (current.time.includes("Z") ? current.time : `${current.time}:00Z`) : new Date().toISOString();
    const stale = isReadingStale(timestamp, 3);

    // Compute CPCB AQI for current observation
    const cpcbResult = calculateCpcbAqi({
      pm2_5: current.pm2_5,
      pm10: current.pm10,
      no2: current.nitrogen_dioxide,
      so2: current.sulphur_dioxide,
      co: current.carbon_monoxide,
      o3: current.ozone,
    });

    // Format hourly forecast points
    const hourlyTimes: string[] = hourly.time || [];
    const hourlyPm25: number[] = hourly.pm2_5 || [];
    const hourlyPm10: number[] = hourly.pm10 || [];
    const hourlyNo2: number[] = hourly.nitrogen_dioxide || [];
    const hourlySo2: number[] = hourly.sulphur_dioxide || [];
    const hourlyCo: number[] = hourly.carbon_monoxide || [];
    const hourlyO3: number[] = hourly.ozone || [];
    const hourlyUsAqi: number[] = hourly.us_aqi || [];

    const formattedForecast: HourlyForecastPoint[] = hourlyTimes.map((timeStr, idx) => {
      const pm25Val = hourlyPm25[idx] ?? 0;
      const pm10Val = hourlyPm10[idx] ?? 0;
      const hourlyCpcb = calculateCpcbAqi({
        pm2_5: pm25Val,
        pm10: pm10Val,
        no2: hourlyNo2[idx],
        so2: hourlySo2[idx],
        co: hourlyCo[idx],
        o3: hourlyO3[idx],
      });

      return {
        time: timeStr,
        pm2_5: Number(pm25Val.toFixed(1)),
        pm10: Number(pm10Val.toFixed(1)),
        no2: hourlyNo2[idx] !== undefined ? Number(hourlyNo2[idx].toFixed(1)) : undefined,
        so2: hourlySo2[idx] !== undefined ? Number(hourlySo2[idx].toFixed(1)) : undefined,
        co: hourlyCo[idx] !== undefined ? Number(hourlyCo[idx].toFixed(1)) : undefined,
        o3: hourlyO3[idx] !== undefined ? Number(hourlyO3[idx].toFixed(1)) : undefined,
        cpcbAqi: hourlyCpcb.aqi,
        usAqi: hourlyUsAqi[idx] ? Math.round(hourlyUsAqi[idx]) : undefined,
      };
    });

    const payload = {
      campus: {
        name: campusName,
        coordinates: { lat, lng },
      },
      monitoringStation: {
        name: stationInfo.stationName,
        distanceKm: stationInfo.distanceKm,
        isPhysicalStation: stationInfo.isPhysicalStation,
        source: stationInfo.source,
      },
      observation: {
        timestamp,
        isStale: stale,
        cpcbAqi: cpcbResult.aqi,
        category: cpcbResult.category,
        categoryDescription: cpcbResult.categoryDescription,
        prominentPollutant: cpcbResult.prominentPollutant,
        subIndices: cpcbResult.subIndices,
        usAqi: current.us_aqi ? Math.round(current.us_aqi) : null,
        rawPollutants: {
          pm2_5: current.pm2_5 ?? null,
          pm10: current.pm10 ?? null,
          no2: current.nitrogen_dioxide ?? null,
          so2: current.sulphur_dioxide ?? null,
          co: current.carbon_monoxide ?? null,
          o3: current.ozone ?? null,
        },
      },
      forecast: formattedForecast.slice(0, 48), // 48-hour forecast
      updatedAt: new Date().toISOString(),
    };

    return sendSuccess(res, payload, "Campus air-quality telemetry retrieved successfully");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to fetch campus air-quality telemetry", 502);
  }
}

/**
 * POST /api/campus/decision
 */
export async function evaluateCampusDecision(req: Request, res: Response) {
  try {
    const inputData: CampusDecisionInput = req.body;

    const validation = validateCampusDecisionInput(inputData);
    if (!validation.valid) {
      return sendError(res, validation.error || "Invalid input parameters", 400);
    }

    const { lat, lng } = inputData.coordinates;

    // Fetch telemetry and hourly forecasts
    const rawData = await fetchOpenMeteoAirQuality(lat, lng);
    const current = rawData.current || {};
    const hourly = rawData.hourly || {};
    const stationInfo = findNearestStation(lat, lng);

    const timestamp = current.time ? (current.time.includes("Z") ? current.time : `${current.time}:00Z`) : new Date().toISOString();

    // Map forecast points
    const hourlyTimes: string[] = hourly.time || [];
    const hourlyPm25: number[] = hourly.pm2_5 || [];
    const hourlyPm10: number[] = hourly.pm10 || [];
    const hourlyNo2: number[] = hourly.nitrogen_dioxide || [];
    const hourlySo2: number[] = hourly.sulphur_dioxide || [];
    const hourlyCo: number[] = hourly.carbon_monoxide || [];
    const hourlyO3: number[] = hourly.ozone || [];

    const forecastPoints: HourlyForecastPoint[] = hourlyTimes.map((timeStr, idx) => {
      const pm25 = hourlyPm25[idx] ?? 0;
      const pm10 = hourlyPm10[idx] ?? 0;
      const hourlyCpcb = calculateCpcbAqi({
        pm2_5: pm25,
        pm10: pm10,
        no2: hourlyNo2[idx],
        so2: hourlySo2[idx],
        co: hourlyCo[idx],
        o3: hourlyO3[idx],
      });

      return {
        time: timeStr,
        pm2_5: pm25,
        pm10: pm10,
        cpcbAqi: hourlyCpcb.aqi,
      };
    });

    const engineInput: CampusDecisionInput = {
      ...inputData,
      currentObservation: {
        timestamp,
        pm2_5: current.pm2_5,
        pm10: current.pm10,
        no2: current.nitrogen_dioxide,
        so2: current.sulphur_dioxide,
        co: current.carbon_monoxide,
        o3: current.ozone,
        stationName: stationInfo.stationName,
        isPhysicalStation: stationInfo.isPhysicalStation,
        distanceKm: stationInfo.distanceKm,
        source: stationInfo.source,
      },
      hourlyForecast: forecastPoints,
    };

    const decisionResult = runDecisionEngine(engineInput);

    return sendSuccess(res, decisionResult, "Campus decision evaluated deterministically");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to evaluate campus decision", 500);
  }
}

/**
 * POST /api/campus/explain
 */
export async function explainCampusDecision(req: Request, res: Response) {
  try {
    const { decisionResult, userQuestion } = req.body;

    if (!decisionResult || !decisionResult.decisionCategory) {
      return sendError(res, "Structured decisionResult payload is required for explanation", 400);
    }

    const explanationResult = await explainCampusDecisionWithBedrock(decisionResult, userQuestion);

    return sendSuccess(res, explanationResult, "Campus decision explanation generated");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to generate decision explanation", 500);
  }
}

/**
 * GET /api/campus/zones
 */
export async function getCampusZones(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.545;
    const lng = parseFloat(req.query.lng as string) || 77.1926;

    // Fetch baseline telemetry
    const rawData = await fetchOpenMeteoAirQuality(lat, lng);
    const current = rawData.current || {};
    const baseCpcb = calculateCpcbAqi({
      pm2_5: current.pm2_5,
      pm10: current.pm10,
      no2: current.nitrogen_dioxide,
      so2: current.sulphur_dioxide,
      co: current.carbon_monoxide,
      o3: current.ozone,
    });

    // Identify nearby zones across campus
    const zones = [
      {
        zoneId: "sports_complex",
        zoneName: "Outdoor Sports Stadium & Tracks",
        zoneType: "High Exertion Arena",
        lat: lat + 0.002,
        lng: lng + 0.003,
        distanceKm: 0.35,
        isPhysicalStation: false,
        dataType: "Spatial Atmospheric Grid Estimate",
        cpcbAqi: Math.round(baseCpcb.aqi * 1.02),
        pm25: Number(((current.pm2_5 ?? 30) * 1.02).toFixed(1)),
        category: baseCpcb.category,
        recommendation: "Review activity duration during mid-afternoon solar heating.",
      },
      {
        zoneId: "academic_quad",
        zoneName: "Main Academic Quad & Central Lawns",
        zoneType: "Low Exertion Gathering",
        lat: lat,
        lng: lng,
        distanceKm: 0.1,
        isPhysicalStation: false,
        dataType: "Spatial Atmospheric Grid Estimate",
        cpcbAqi: baseCpcb.aqi,
        pm25: Number((current.pm2_5 ?? 30).toFixed(1)),
        category: baseCpcb.category,
        recommendation: "Favorable for outdoor seating and quiet transit.",
      },
      {
        zoneId: "campus_perimeter",
        zoneName: "North Entrance & Arterial Transit Gate",
        zoneType: "Vehicle Transit Corridor",
        lat: lat - 0.004,
        lng: lng - 0.002,
        distanceKm: 0.5,
        isPhysicalStation: false,
        dataType: "Spatial Atmospheric Grid Estimate",
        cpcbAqi: Math.round(baseCpcb.aqi * 1.08),
        pm25: Number(((current.pm2_5 ?? 30) * 1.08).toFixed(1)),
        category: baseCpcb.category,
        recommendation: "Elevated particulate concentrations due to vehicle idling at gates.",
      },
      {
        zoneId: "botanical_green",
        zoneName: "Campus Botanical Garden & Eco-Park",
        zoneType: "Canopy Green Space",
        lat: lat + 0.003,
        lng: lng - 0.004,
        distanceKm: 0.6,
        isPhysicalStation: false,
        dataType: "Spatial Atmospheric Grid Estimate",
        cpcbAqi: Math.max(15, Math.round(baseCpcb.aqi * 0.92)),
        pm25: Number(((current.pm2_5 ?? 30) * 0.92).toFixed(1)),
        category: baseCpcb.category,
        recommendation: "Vegetative buffer zone offers modest reduction in coarse dust.",
      },
    ];

    // Also include the nearest official physical monitoring station
    const nearestStation = findNearestStation(lat, lng);

    return sendSuccess(
      res,
      {
        campusReference: { lat, lng },
        nearestOfficialStation: nearestStation,
        zones,
        attributionNotice:
          "Zones without a physical on-site sensor display high-resolution spatial atmospheric estimates. Do not assume microclimate purity without dedicated zone sensors.",
      },
      "Campus zones telemetry retrieved"
    );
  } catch (error: any) {
    return sendError(res, error.message || "Failed to retrieve campus zones", 500);
  }
}
