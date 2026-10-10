import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { calculateCpcbAqi, CpcbAqiResult } from "../services/cpcb-aqi.service.js";
import { generateRouteAiHealthAssessment } from "../services/openai.service.js";
import { calculateExposureScore } from "../services/exposure.service.js";

/**
 * Air quality data cache to avoid redundant Open-Meteo requests.
 * Key: "lat,lng" rounded to 2 decimal places (Open-Meteo grid resolution ~0.1°)
 * Value: { data, fetchedAt }
 */
const aqCache = new Map<string, { data: any; fetchedAt: number }>();
const AQ_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

/**
 * Sample N evenly-spaced points along a route geometry.
 * Returns [lat, lng] pairs suitable for Open-Meteo batch queries.
 */
function sampleRoutePoints(
  coordinates: [number, number][],
  maxSamples: number = 5
): [number, number][] {
  if (coordinates.length <= maxSamples) return coordinates;

  const step = (coordinates.length - 1) / (maxSamples - 1);
  const sampled: [number, number][] = [];
  for (let i = 0; i < maxSamples; i++) {
    const idx = Math.min(Math.round(i * step), coordinates.length - 1);
    sampled.push(coordinates[idx]);
  }
  return sampled;
}

/**
 * Fetch air quality from Open-Meteo for a batch of lat/lng points.
 * Uses the batch API (comma-separated coordinates) to minimize requests.
 * Returns per-point pollutant data.
 */
async function fetchAirQualityBatch(
  points: [number, number][]
): Promise<Array<{
  lat: number;
  lng: number;
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  nh3: number | null;
  fromCache: boolean;
}>> {
  const results: Array<any> = [];
  const uncachedPoints: [number, number][] = [];
  const uncachedIndices: number[] = [];

  // Check cache first
  for (let i = 0; i < points.length; i++) {
    const [lat, lng] = points[i];
    const key = getCacheKey(lat, lng);
    const cached = aqCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < AQ_CACHE_TTL_MS) {
      results[i] = { ...cached.data, fromCache: true };
    } else {
      uncachedPoints.push([lat, lng]);
      uncachedIndices.push(i);
      results[i] = null; // placeholder
    }
  }

  if (uncachedPoints.length === 0) return results;

  // Batch fetch uncached points (Open-Meteo supports comma-separated lat/lng)
  const lats = uncachedPoints.map((p) => p[0]).join(",");
  const lngs = uncachedPoints.map((p) => p[1]).join(",");

  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lngs}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,ammonia&timezone=auto`;
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`Open-Meteo AQ batch failed: HTTP ${res.status}`);
      // Fill with nulls
      for (const idx of uncachedIndices) {
        results[idx] = {
          lat: points[idx][0],
          lng: points[idx][1],
          pm2_5: null, pm10: null, no2: null, so2: null, co: null, o3: null, nh3: null,
          fromCache: false,
        };
      }
      return results;
    }

    const data = await res.json();

    // Open-Meteo returns an array for multi-coordinate, or single object for one coordinate
    const entries = Array.isArray(data) ? data : [data];

    for (let j = 0; j < uncachedIndices.length; j++) {
      const idx = uncachedIndices[j];
      const entry = entries[j];
      const current = entry?.current || {};
      const [lat, lng] = uncachedPoints[j];

      const pointData = {
        lat,
        lng,
        pm2_5: current.pm2_5 ?? null,
        pm10: current.pm10 ?? null,
        no2: current.nitrogen_dioxide ?? null,
        so2: current.sulphur_dioxide ?? null,
        co: current.carbon_monoxide ?? null,
        o3: current.ozone ?? null,
        nh3: current.ammonia ?? null,
        fromCache: false,
      };

      // Cache it
      aqCache.set(getCacheKey(lat, lng), {
        data: { ...pointData, fromCache: false },
        fetchedAt: Date.now(),
      });

      results[idx] = pointData;
    }
  } catch (err) {
    console.warn("Open-Meteo batch AQ fetch error:", err);
    for (const idx of uncachedIndices) {
      results[idx] = {
        lat: points[idx][0],
        lng: points[idx][1],
        pm2_5: null, pm10: null, no2: null, so2: null, co: null, o3: null, nh3: null,
        fromCache: false,
      };
    }
  }

  return results;
}

/**
 * Compute a pollution comparison score for a route given sampled air quality data.
 * Returns an estimated CPCB-style index along the route and per-pollutant averages.
 * 
 * Methodology:
 * - For each sampled point, calculate a CPCB sub-index from available pollutants.
 * - Average the sub-indices across all sampled points.
 * - The result is an "Estimated Average Pollution Score" — NOT an official CPCB AQI reading.
 * 
 * Limitations:
 * - Open-Meteo provides modelled data on a ~0.1° grid (~11 km), not street-level measurements.
 * - For routes within the same city, sampled points may fall on the same grid cell,
 *   producing identical readings — the score cannot distinguish between nearby streets.
 */
function computeRoutePollutionScore(
  aqSamples: Array<{
    pm2_5: number | null;
    pm10: number | null;
    no2: number | null;
    so2: number | null;
    co: number | null;
    o3: number | null;
    nh3: number | null;
  }>
): {
  estimatedScore: number;
  category: string;
  averagePollutants: Record<string, number | null>;
  sampleCount: number;
  validSampleCount: number;
  allSamplesIdentical: boolean;
  methodology: string;
} {
  let totalScore = 0;
  let validCount = 0;
  const pollutantSums: Record<string, { total: number; count: number }> = {
    pm2_5: { total: 0, count: 0 },
    pm10: { total: 0, count: 0 },
    no2: { total: 0, count: 0 },
    so2: { total: 0, count: 0 },
    co: { total: 0, count: 0 },
    o3: { total: 0, count: 0 },
    nh3: { total: 0, count: 0 },
  };

  const subIndexValues: number[] = [];

  for (const sample of aqSamples) {
    if (!sample) continue;

    const cpcb = calculateCpcbAqi({
      pm2_5: sample.pm2_5,
      pm10: sample.pm10,
      no2: sample.no2,
      so2: sample.so2,
      co: sample.co,
      o3: sample.o3,
      nh3: sample.nh3 ?? 18.4,
      pb: 0.18,
    });

    if (cpcb.aqi > 0) {
      totalScore += cpcb.aqi;
      validCount++;
      subIndexValues.push(cpcb.aqi);
    }

    // Accumulate per-pollutant averages
    for (const key of Object.keys(pollutantSums)) {
      const val = (sample as any)[key];
      if (val !== null && val !== undefined && !isNaN(val)) {
        pollutantSums[key].total += val;
        pollutantSums[key].count++;
      }
    }
  }

  const estimatedScore = validCount > 0 ? Math.round(totalScore / validCount) : 0;

  // Detect if all samples returned effectively the same score (same grid cell)
  const allSamplesIdentical =
    subIndexValues.length > 1 &&
    subIndexValues.every((v) => Math.abs(v - subIndexValues[0]) <= 5);

  // Build average pollutants
  const averagePollutants: Record<string, number | null> = {};
  for (const [key, { total, count }] of Object.entries(pollutantSums)) {
    averagePollutants[key] = count > 0 ? Number((total / count).toFixed(1)) : null;
  }

  // Determine category from estimated score
  let category = "Unknown";
  if (estimatedScore <= 50) category = "Good";
  else if (estimatedScore <= 100) category = "Satisfactory";
  else if (estimatedScore <= 200) category = "Moderate";
  else if (estimatedScore <= 300) category = "Poor";
  else if (estimatedScore <= 400) category = "Very Poor";
  else category = "Severe";

  return {
    estimatedScore,
    category,
    averagePollutants,
    sampleCount: aqSamples.length,
    validSampleCount: validCount,
    allSamplesIdentical,
    methodology:
      "Average of CPCB-formula sub-indices calculated from Open-Meteo modelled pollutant concentrations, " +
      "sampled at evenly-spaced points along the route geometry. " +
      "Open-Meteo data has ~11 km grid resolution — nearby routes may show identical scores. " +
      "This is an ESTIMATE, not an official CPCB measurement.",
  };
}

/**
 * POST /api/routes/plan
 * 
 * Request body:
 * {
 *   origin: { lat: number, lng: number, name?: string },
 *   destination: { lat: number, lng: number, name?: string },
 *   profile?: "driving" | "walking" | "cycling"   // OSRM only supports "driving" on public server
 * }
 * 
 * Response: Routes with geometry, distance, duration, and estimated pollution scores.
 */
export async function planRoute(req: Request, res: Response) {
  try {
    const { origin, destination, profile = "driving" } = req.body;

    if (
      !origin?.lat || !origin?.lng ||
      !destination?.lat || !destination?.lng
    ) {
      return sendError(res, "Origin and destination with lat/lng are required", 400);
    }

    // Validate coordinates are reasonable
    if (
      Math.abs(origin.lat) > 90 || Math.abs(origin.lng) > 180 ||
      Math.abs(destination.lat) > 90 || Math.abs(destination.lng) > 180
    ) {
      return sendError(res, "Invalid coordinates", 400);
    }

    // 1. Fetch routes from OSRM with alternatives
    const osrmProfile = profile === "walking" ? "foot" : profile === "cycling" ? "bicycle" : "driving";
    const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=true&steps=false`;

    const osrmRes = await fetch(osrmUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!osrmRes.ok) {
      return sendError(
        res,
        `Routing service returned HTTP ${osrmRes.status}. The public OSRM server may be temporarily unavailable.`,
        502
      );
    }

    const osrmData = await osrmRes.json();

    if (osrmData.code !== "Ok" || !osrmData.routes || osrmData.routes.length === 0) {
      return sendError(
        res,
        osrmData.message || "No route found between the specified locations",
        404
      );
    }

    // 2. Process each OSRM route
    const routePromises = osrmData.routes.map(async (osrmRoute: any, index: number) => {
      // Convert GeoJSON [lng, lat] to [lat, lng]
      const coordinates: [number, number][] = osrmRoute.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      const distanceKm = Number((osrmRoute.distance / 1000).toFixed(1));
      const durationMin = Math.round(osrmRoute.duration / 60);

      // Sample points along route for air quality
      const sampledPoints = sampleRoutePoints(coordinates, 5);

      // Fetch air quality at sampled points
      const aqSamples = await fetchAirQualityBatch(sampledPoints);

      // Compute pollution score
      const pollutionResult = computeRoutePollutionScore(aqSamples);

      // Compute peak AQI along the route
      let peakAqi = 0;
      sampledPoints.forEach((_, i) => {
        const sample = aqSamples[i];
        if (sample) {
          const ptCpcb = calculateCpcbAqi({
            pm2_5: sample.pm2_5,
            pm10: sample.pm10,
            no2: sample.no2,
            so2: sample.so2,
            co: sample.co,
            o3: sample.o3,
            nh3: sample.nh3 ?? 18.4,
            pb: 0.18,
          });
          if (ptCpcb.aqi > peakAqi) peakAqi = ptCpcb.aqi;
        }
      });
      if (peakAqi === 0) peakAqi = pollutionResult.estimatedScore;

      // Cumulative Inhaled Dose Index = avgAQI * (durationMin / 10)
      const exposureIndex = Math.round(pollutionResult.estimatedScore * (durationMin / 10));

      // WHO Exposure Score via exposure.service
      const durationHours = durationMin / 60;
      const avgPm25 = pollutionResult.averagePollutants.pm2_5 ?? 45;
      const activityMode = profile === "walking" ? "walking" : profile === "cycling" ? "biking" : "transit";
      const whoExposure = calculateExposureScore({
        pm25: avgPm25,
        durationHours,
        activityMode,
        locationType: "urban",
      });

      // Estimated microgram PM2.5 inhaled based on physiological minute ventilation:
      // Driving: 9 L/min (0.009 m3/min); Walking: 20 L/min (0.02 m3/min); Cycling: 35 L/min (0.035 m3/min)
      const ventilationRateM3Min = profile === "walking" ? 0.02 : profile === "cycling" ? 0.035 : 0.009;
      const estimatedInhaledPm25Ug = Number((avgPm25 * ventilationRateM3Min * durationMin).toFixed(1));

      return {
        index,
        label: `Route ${String.fromCharCode(65 + index)}`,
        distanceKm,
        durationMin,
        durationFormatted: durationMin >= 60
          ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
          : `${durationMin} min`,
        geometry: coordinates,
        geometryGeoJSON: osrmRoute.geometry,
        pollution: pollutionResult,
        peakAqi,
        exposureIndex,
        whoExposureScore: whoExposure.exposureScore,
        whoExposureCategory: whoExposure.category,
        estimatedInhaledPm25Ug,
        sampledPoints: sampledPoints.map(([lat, lng], i) => ({
          lat,
          lng,
          aq: aqSamples[i]
            ? {
                pm2_5: aqSamples[i].pm2_5,
                pm10: aqSamples[i].pm10,
                no2: aqSamples[i].no2,
                o3: aqSamples[i].o3,
                fromCache: aqSamples[i].fromCache,
              }
            : null,
        })),
      };
    });

    const routes = await Promise.all(routePromises);

    // 3. Find Health-Optimal and Fastest routes
    let lowestExposureIdx = 0;
    let lowestExposureVal = routes[0]?.exposureIndex ?? 0;
    let fastestIdx = 0;
    let fastestDuration = routes[0]?.durationMin ?? 0;

    routes.forEach((r, idx) => {
      if (r.exposureIndex < lowestExposureVal) {
        lowestExposureVal = r.exposureIndex;
        lowestExposureIdx = idx;
      }
      if (r.durationMin < fastestDuration) {
        fastestDuration = r.durationMin;
        fastestIdx = idx;
      }
    });

    const fastest = routes[fastestIdx];
    const healthiest = routes[lowestExposureIdx];
    const exposureSavingPercent =
      fastest && healthiest && fastest.exposureIndex > 0
        ? Math.max(0, Math.round(((fastest.exposureIndex - healthiest.exposureIndex) / fastest.exposureIndex) * 100))
        : 0;

    // Assign labels and badges based on health & time
    routes.forEach((r, idx) => {
      const isHealthiest = idx === lowestExposureIdx;
      const isFast = idx === fastestIdx;
      (r as any).isHealthOptimal = isHealthiest;
      (r as any).isFastest = isFast;

      let label = `Route ${String.fromCharCode(65 + idx)}`;
      if (isHealthiest && isFast) {
        label += " — 🌿 Cleanest & Fastest";
      } else if (isHealthiest) {
        label += ` — 🌿 Health-Optimal (${exposureSavingPercent > 0 ? `-${exposureSavingPercent}% Dose` : "Lowest Exposure"})`;
      } else if (isFast) {
        label += " — ⚡ Fastest Transit";
      }
      r.label = label;

      if (!isFast && fastest) {
        const diff = r.durationMin - fastest.durationMin;
        if (diff > 0) (r as any).timeDifferenceMin = diff;
      }
    });

    // 4. Generate AI Environmental Health Report using OpenAI Service
    const aiHealthAssessment = await generateRouteAiHealthAssessment({
      originName: origin.name || "Origin",
      destinationName: destination.name || "Destination",
      travelMode: profile === "walking" ? "walking" : profile === "cycling" ? "cycling" : "driving",
      routes: routes.map((r) => ({
        index: r.index,
        label: r.label,
        distanceKm: r.distanceKm,
        durationMin: r.durationMin,
        averageAqi: r.pollution.estimatedScore,
        peakAqi: r.peakAqi,
        exposureIndex: r.exposureIndex,
        pm2_5: r.pollution.averagePollutants.pm2_5,
        no2: r.pollution.averagePollutants.no2,
        category: r.pollution.category,
      })),
    });

    // 5. Generate concise insights
    const insights: string[] = [];

    if (routes.length === 1) {
      insights.push("Single corridor available between these locations.");
    } else {
      if (lowestExposureIdx !== fastestIdx && exposureSavingPercent >= 10) {
        insights.push(
          `Route ${String.fromCharCode(65 + lowestExposureIdx)} reduces cumulative lung exposure by ~${exposureSavingPercent}% compared to the fastest alternative.`
        );
      } else {
        insights.push(
          `Route ${String.fromCharCode(65 + fastestIdx)} minimizes total transit duration, yielding the lowest cumulative inhalation burden.`
        );
      }

      const anyHighPeak = routes.find((r) => r.peakAqi > 200);
      if (anyHighPeak) {
        insights.push(
          `Route ${String.fromCharCode(65 + anyHighPeak.index)} intersects a high-pollution hotspot (Peak AQI ${anyHighPeak.peakAqi}). Vulnerable commuters should take precautions.`
        );
      }
    }

    return sendSuccess(res, {
      routes,
      routeCount: routes.length,
      healthOptimalRouteIndex: lowestExposureIdx,
      fastestRouteIndex: fastestIdx,
      exposureSavingPercent,
      aiHealthAssessment,
      insights,
      dataSource: "OSRM (routing) + Open-Meteo (AQI) + OpenAI (Medical Intelligence)",
      pollutionScoreStandard: "CPCB Sub-Index Formulation + WHO Inhaled Particulate Model",
      fetchedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Route planning error:", error);

    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return sendError(res, "Routing service timed out. Please try again.", 504);
    }

    return sendError(
      res,
      error.message || "Failed to plan route",
      500
    );
  }
}

/**
 * GET /api/routes/geocode?q=<search query>
 * 
 * Geocodes a location string using OpenStreetMap Nominatim.
 * Returns up to 5 results with name, lat, lng.
 */
export async function geocodeSearch(req: Request, res: Response) {
  try {
    const query = (req.query.q as string)?.trim();
    if (!query || query.length < 2) {
      return sendError(res, "Query must be at least 2 characters", 400);
    }

    const encoded = encodeURIComponent(query);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5&addressdetails=1&accept-language=en`;

    const nominRes = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "BreatheWise/1.0 (air quality route planner)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!nominRes.ok) {
      return sendError(res, "Geocoding service unavailable", 502);
    }

    const data = await nominRes.json();

    const results = (data as any[]).map((item) => ({
      displayName: item.display_name,
      name: item.name || item.display_name?.split(",")[0] || query,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
      address: item.address
        ? {
            road: item.address.road,
            suburb: item.address.suburb,
            city: item.address.city || item.address.town || item.address.village,
            state: item.address.state,
            country: item.address.country,
          }
        : null,
    }));

    return sendSuccess(res, results, `Found ${results.length} results`);
  } catch (error: any) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return sendError(res, "Geocoding service timed out", 504);
    }
    return sendError(res, error.message || "Geocoding failed", 500);
  }
}
