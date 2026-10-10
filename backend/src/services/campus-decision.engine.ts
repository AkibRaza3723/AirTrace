import {
  calculateCpcbAqi,
  isReadingStale,
  CpcbAqiResult,
  CpcbCategory,
} from "./cpcb-aqi.service.js";

export type ActivityType =
  | "outdoor_assembly"
  | "sports"
  | "walking"
  | "outdoor_events";

export type DecisionCategory =
  | "Conditions comparatively more favorable"
  | "Consider an alternative time or location"
  | "Follow applicable official guidance and review conditions"
  | "Insufficient or outdated data";

export type ReasonCode =
  | "OBSERVATION_STALE"
  | "FORECAST_UNAVAILABLE"
  | "DATA_INSUFFICIENT"
  | "PLANNED_SLOT_LESS_FAVORABLE"
  | "ALTERNATIVE_SLOT_RELATIVELY_BETTER"
  | "PLANNED_SLOT_FAVORABLE"
  | "HUMAN_REVIEW_REQUIRED"
  | "HIGH_POLLUTION_RESTRICTION";

export interface HourlyForecastPoint {
  time: string; // ISO string or 'YYYY-MM-DDTHH:mm'
  pm2_5: number;
  pm10: number;
  no2?: number;
  so2?: number;
  co?: number;
  o3?: number;
  cpcbAqi: number;
  usAqi?: number;
}

export interface SlotAnalysis {
  slotLabel: string;
  startTime: string;
  endTime: string;
  averageAqi: number;
  peakPm25: number;
  peakAqi: number;
  category: CpcbCategory;
  dataPointsCount: number;
}

export interface CampusDecisionInput {
  campusName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  activityType: ActivityType;
  plannedDate: string; // 'YYYY-MM-DD'
  plannedStartTime: string; // 'HH:mm'
  plannedDurationMinutes: number; // 15 - 480
  alternativeStartTime?: string; // 'HH:mm'
  currentObservation?: {
    timestamp: string;
    pm2_5?: number | null;
    pm10?: number | null;
    no2?: number | null;
    so2?: number | null;
    co?: number | null;
    o3?: number | null;
    stationName?: string;
    isPhysicalStation?: boolean;
    distanceKm?: number;
    source?: string;
  };
  hourlyForecast?: HourlyForecastPoint[];
}

export interface ActivityGuidanceConfig {
  displayName: string;
  exertionLevel: "Low" | "Moderate" | "High";
  officialSource: string;
  thresholds: {
    favorableMaxAqi: number;
    advisoryMaxAqi: number;
    restrictionMinAqi: number;
  };
  guidanceText: {
    favorable: string;
    advisory: string;
    restricted: string;
  };
}

export const ACTIVITY_POLICIES: Record<ActivityType, ActivityGuidanceConfig> = {
  outdoor_assembly: {
    displayName: "Outdoor Assembly & Gatherings",
    exertionLevel: "Low",
    officialSource: "CPCB Public Health Advisory & Indian School Protocols (2024)",
    thresholds: {
      favorableMaxAqi: 100,
      advisoryMaxAqi: 200,
      restrictionMinAqi: 301,
    },
    guidanceText: {
      favorable: "Standard outdoor assembly permitted. Ambient concentrations are within acceptable national limits.",
      advisory: "Sensitive individuals (asthmatic/cardiac) should remain indoors or sit in shaded, sheltered areas. Consider shortening assembly duration.",
      restricted: "Mandatory indoor relocation or postponement recommended. Ambient particulate load poses elevated inhalation risks.",
    },
  },
  sports: {
    displayName: "Sports, Athletics & High-Exertion PE",
    exertionLevel: "High",
    officialSource: "National Programme on Climate Change and Human Health (NPCCHH) Sports Exposure Guidelines",
    thresholds: {
      favorableMaxAqi: 100,
      advisoryMaxAqi: 150,
      restrictionMinAqi: 201,
    },
    guidanceText: {
      favorable: "Full competitive sports, athletic training, and outdoor physical education fully approved.",
      advisory: "Elevated respiratory intake during heavy exertion. Reduce workout intensity, increase rest intervals, and monitor athletes for coughing or wheezing.",
      restricted: "High-intensity outdoor cardiovascular drills must be suspended. Transfer sessions to indoor gymnasiums with filtered ventilation.",
    },
  },
  walking: {
    displayName: "Walking, Campus Commute & Transit",
    exertionLevel: "Moderate",
    officialSource: "CPCB Environmental Health Criteria for Ambient Air Quality",
    thresholds: {
      favorableMaxAqi: 150,
      advisoryMaxAqi: 250,
      restrictionMinAqi: 301,
    },
    guidanceText: {
      favorable: "Pedestrian pathways and active campus transit recommended without restrictions.",
      advisory: "Use tree-lined, inner campus pathways away from perimeter traffic arteries. Sensitive walkers may use particulate filtration (N95).",
      restricted: "Minimize outdoor walking exposure. Utilize enclosed campus transit shuttles or covered walkways where feasible.",
    },
  },
  outdoor_events: {
    displayName: "General Outdoor Campus Events",
    exertionLevel: "Moderate",
    officialSource: "Ministry of Environment & Forest Graded Action Framework for Public Gatherings",
    thresholds: {
      favorableMaxAqi: 100,
      advisoryMaxAqi: 200,
      restrictionMinAqi: 251,
    },
    guidanceText: {
      favorable: "Open-air pavilions, cultural events, and festivals approved under standard protocols.",
      advisory: "Provide sheltered indoor rest zones and clean hydration stations. Inform attendees with respiratory sensitivities.",
      restricted: "Outdoor event requires operational review. Relocate to auditorium or reschedule to a comparatively cleaner forecasted window.",
    },
  },
};

export interface CampusDecisionResult {
  decisionCategory: DecisionCategory;
  primaryRecommendation: string;
  reasonCodes: ReasonCode[];
  reasons: string[];
  activity: {
    type: ActivityType;
    displayName: string;
    exertionLevel: string;
    officialPolicySource: string;
  };
  currentConditions: {
    aqi: number;
    category: CpcbCategory;
    prominentPollutant: string;
    timestamp: string;
    isStale: boolean;
    source: string;
    stationName: string;
    distanceKm: number | null;
    isPhysicalStation: boolean;
  } | null;
  slotComparison: {
    plannedSlot: SlotAnalysis | null;
    alternativeSlot: SlotAnalysis | null;
    preferredSlot: "planned" | "alternative" | "neither" | "insufficient_data";
    aqiDifference: number | null;
    comparisonSummary: string;
  };
  limitations: string[];
  nextReviewTime: string;
  dataQuality: {
    hasValidObservation: boolean;
    hasHourlyForecast: boolean;
    freshnessMinutes: number | null;
  };
  generatedAt: string;
}

/**
 * Validates input coordinates, duration, and time format
 */
export function validateCampusDecisionInput(input: CampusDecisionInput): { valid: boolean; error?: string } {
  if (!input.campusName || input.campusName.trim().length === 0) {
    return { valid: false, error: "Campus name is required" };
  }

  const { lat, lng } = input.coordinates || {};
  if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
    return { valid: false, error: "Valid GPS coordinates (latitude, longitude) are required" };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: "Latitude must be between -90 and 90 degrees" };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, error: "Longitude must be between -180 and 180 degrees" };
  }

  if (
    !input.plannedDurationMinutes ||
    isNaN(input.plannedDurationMinutes) ||
    input.plannedDurationMinutes < 15 ||
    input.plannedDurationMinutes > 480
  ) {
    return { valid: false, error: "Planned activity duration must be between 15 and 480 minutes (8 hours)" };
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!input.plannedStartTime || !timeRegex.test(input.plannedStartTime)) {
    return { valid: false, error: "Planned start time must be in 24-hour format HH:mm (e.g. '09:00')" };
  }
  if (input.alternativeStartTime && !timeRegex.test(input.alternativeStartTime)) {
    return { valid: false, error: "Alternative start time must be in 24-hour format HH:mm (e.g. '16:00')" };
  }

  return { valid: true };
}

/**
 * Parses time window and extracts relevant forecast slice
 */
function analyzeTimeSlot(
  forecast: HourlyForecastPoint[],
  dateStr: string,
  startTimeStr: string,
  durationMinutes: number,
  label: string
): SlotAnalysis | null {
  if (!forecast || forecast.length === 0) return null;

  try {
    const [startHour, startMin] = startTimeStr.split(":").map(Number);
    const startDateTime = new Date(`${dateStr}T${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00Z`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    const endHour = endDateTime.getUTCHours();
    const endMinutes = endDateTime.getUTCMinutes();
    const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;

    // Filter matching forecast points
    const pointsInWindow = forecast.filter((pt) => {
      const ptDate = new Date(pt.time.includes("Z") ? pt.time : `${pt.time}:00Z`);
      // Allow 1 hour buffer around the window
      return (
        ptDate.getTime() >= startDateTime.getTime() - 30 * 60 * 1000 &&
        ptDate.getTime() <= endDateTime.getTime() + 30 * 60 * 1000
      );
    });

    if (pointsInWindow.length === 0) {
      // If date mismatch, check by hour of day as forecast sample
      const fallbackPoints = forecast.filter((pt) => {
        const ptDate = new Date(pt.time);
        const hour = ptDate.getHours();
        return hour >= startHour && hour <= Math.ceil(startHour + durationMinutes / 60);
      });

      if (fallbackPoints.length === 0) return null;
      return computeSlotMetrics(fallbackPoints, label, startTimeStr, endTimeStr);
    }

    return computeSlotMetrics(pointsInWindow, label, startTimeStr, endTimeStr);
  } catch {
    return null;
  }
}

function computeSlotMetrics(
  points: HourlyForecastPoint[],
  label: string,
  startTime: string,
  endTime: string
): SlotAnalysis {
  const avgAqi = Math.round(points.reduce((acc, p) => acc + p.cpcbAqi, 0) / points.length);
  const peakPm25 = Math.max(...points.map((p) => p.pm2_5));
  const peakAqi = Math.max(...points.map((p) => p.cpcbAqi));

  let category: CpcbCategory = "Good";
  if (avgAqi > 400) category = "Severe";
  else if (avgAqi > 300) category = "Very Poor";
  else if (avgAqi > 200) category = "Poor";
  else if (avgAqi > 100) category = "Moderate";
  else if (avgAqi > 50) category = "Satisfactory";

  return {
    slotLabel: label,
    startTime,
    endTime,
    averageAqi: avgAqi,
    peakPm25: Number(peakPm25.toFixed(1)),
    peakAqi,
    category,
    dataPointsCount: points.length,
  };
}

/**
 * Deterministic Campus Decision Engine
 */
export function evaluateCampusDecision(input: CampusDecisionInput): CampusDecisionResult {
  const generatedAt = new Date().toISOString();
  const policy = ACTIVITY_POLICIES[input.activityType] || ACTIVITY_POLICIES.outdoor_events;

  const reasons: string[] = [];
  const reasonCodes: ReasonCode[] = [];
  const limitations: string[] = [
    "Guidance reflects ambient atmospheric readings and meteorological model estimates, not personal biological dose.",
    "Microclimate variations (indoor airflow, tree density, localized traffic idling) may cause local variances.",
    "This is an operational decision aid, not a formal medical health clearance or certified statutory notice.",
  ];

  // 1. Evaluate Current Observation
  let currentConditions = null;
  let hasValidObservation = false;
  let isStale = false;
  let freshnessMinutes: number | null = null;

  if (input.currentObservation && input.currentObservation.timestamp) {
    const obs = input.currentObservation;
    isStale = isReadingStale(obs.timestamp, 3);
    const readingTime = new Date(obs.timestamp).getTime();
    freshnessMinutes = Math.max(0, Math.round((Date.now() - readingTime) / (1000 * 60)));

    const cpcbResult: CpcbAqiResult = calculateCpcbAqi({
      pm2_5: obs.pm2_5,
      pm10: obs.pm10,
      no2: obs.no2,
      so2: obs.so2,
      co: obs.co,
      o3: obs.o3,
    });

    if (cpcbResult.aqi > 0 || (obs.pm2_5 !== undefined && obs.pm2_5 !== null)) {
      hasValidObservation = true;
      currentConditions = {
        aqi: cpcbResult.aqi,
        category: cpcbResult.category,
        prominentPollutant: cpcbResult.prominentPollutant,
        timestamp: obs.timestamp,
        isStale,
        source: obs.source || "Official CPCB / Open-Meteo Air Quality Telemetry",
        stationName: obs.stationName || "Campus Atmospheric Telemetry Station",
        distanceKm: obs.distanceKm ?? null,
        isPhysicalStation: obs.isPhysicalStation ?? false,
      };

      if (!obs.isPhysicalStation) {
        limitations.push(
          "Current telemetry is derived from a high-resolution spatial atmospheric grid point, not a physical on-campus sensor."
        );
      } else if (obs.distanceKm && obs.distanceKm > 5) {
        limitations.push(
          `Nearest physical monitoring station is ${obs.distanceKm} km from campus; local neighborhood emissions may differ.`
        );
      }
    }
  }

  if (isStale) {
    reasonCodes.push("OBSERVATION_STALE");
    reasons.push(
      `Latest telemetry timestamp is older than 3 hours (${freshnessMinutes} minutes elapsed). Fresh ground measurements are recommended.`
    );
  }

  // 2. Evaluate Hourly Forecast & Slot Comparison
  const hasHourlyForecast = Array.isArray(input.hourlyForecast) && input.hourlyForecast.length > 0;
  let plannedSlot: SlotAnalysis | null = null;
  let alternativeSlot: SlotAnalysis | null = null;

  if (hasHourlyForecast) {
    plannedSlot = analyzeTimeSlot(
      input.hourlyForecast!,
      input.plannedDate,
      input.plannedStartTime,
      input.plannedDurationMinutes,
      `Planned Slot (${input.plannedStartTime})`
    );

    if (input.alternativeStartTime) {
      alternativeSlot = analyzeTimeSlot(
        input.hourlyForecast!,
        input.plannedDate,
        input.alternativeStartTime,
        input.plannedDurationMinutes,
        `Alternative Slot (${input.alternativeStartTime})`
      );
    }
  } else {
    reasonCodes.push("FORECAST_UNAVAILABLE");
    reasons.push("Hourly pollutant forecast data is currently unavailable for time-slot comparison.");
  }

  // Next review time default: 1 hour from now or 30 mins before planned activity
  const nextReviewDate = new Date(Date.now() + 60 * 60 * 1000);
  const nextReviewTime = nextReviewDate.toISOString();

  // 3. Fallback: If no valid observation and no forecast
  if (!hasValidObservation && !plannedSlot) {
    reasonCodes.push("DATA_INSUFFICIENT");
    reasons.push("Insufficient telemetry: neither recent ground observations nor forecast predictions were accessible.");

    return {
      decisionCategory: "Insufficient or outdated data",
      primaryRecommendation: "Hold outdoor scheduling decisions until verified atmospheric telemetry becomes available.",
      reasonCodes,
      reasons,
      activity: {
        type: input.activityType,
        displayName: policy.displayName,
        exertionLevel: policy.exertionLevel,
        officialPolicySource: policy.officialSource,
      },
      currentConditions: null,
      slotComparison: {
        plannedSlot: null,
        alternativeSlot: null,
        preferredSlot: "insufficient_data",
        aqiDifference: null,
        comparisonSummary: "No telemetry available to rank activity windows.",
      },
      limitations,
      nextReviewTime,
      dataQuality: {
        hasValidObservation: false,
        hasHourlyForecast: false,
        freshnessMinutes,
      },
      generatedAt,
    };
  }

  // 4. Decision Logic & Slot Comparison
  const baselineAqi = plannedSlot?.averageAqi ?? currentConditions?.aqi ?? 0;
  let decisionCategory: DecisionCategory = "Conditions comparatively more favorable";
  let primaryRecommendation = "";
  let preferredSlot: "planned" | "alternative" | "neither" | "insufficient_data" = "planned";
  let aqiDifference: number | null = null;
  let comparisonSummary = "";

  const { favorableMaxAqi, advisoryMaxAqi, restrictionMinAqi } = policy.thresholds;

  // Scenario A: Alternative Slot Comparison Available
  if (plannedSlot && alternativeSlot) {
    aqiDifference = plannedSlot.averageAqi - alternativeSlot.averageAqi; // positive means alternative is cleaner

    if (aqiDifference >= 20 || (plannedSlot.averageAqi > advisoryMaxAqi && alternativeSlot.averageAqi <= advisoryMaxAqi)) {
      // Alternative is noticeably cleaner
      preferredSlot = "alternative";
      decisionCategory = "Consider an alternative time or location";
      reasonCodes.push("ALTERNATIVE_SLOT_RELATIVELY_BETTER", "PLANNED_SLOT_LESS_FAVORABLE");
      reasons.push(
        `Alternative slot (${alternativeSlot.startTime}–${alternativeSlot.endTime}) forecasts lower pollution (AQI ~${alternativeSlot.averageAqi}) compared to planned slot (AQI ~${plannedSlot.averageAqi}, Δ ${aqiDifference} points lower).`
      );
      primaryRecommendation = `Reschedule ${policy.displayName.toLowerCase()} to the alternative time window (${alternativeSlot.startTime}) for reduced respiratory exposure.`;
      comparisonSummary = `Alternative window is ~${Math.round((aqiDifference / plannedSlot.averageAqi) * 100)}% cleaner in particulate levels.`;
    } else if (baselineAqi > restrictionMinAqi && alternativeSlot.averageAqi > restrictionMinAqi) {
      // Both are severely polluted
      preferredSlot = "neither";
      decisionCategory = "Follow applicable official guidance and review conditions";
      reasonCodes.push("HIGH_POLLUTION_RESTRICTION", "HUMAN_REVIEW_REQUIRED");
      reasons.push(
        `Both planned (AQI ${plannedSlot.averageAqi}) and alternative (AQI ${alternativeSlot.averageAqi}) windows exceed the threshold of ${restrictionMinAqi} for ${policy.exertionLevel.toLowerCase()}-exertion activities.`
      );
      primaryRecommendation = `Move ${policy.displayName.toLowerCase()} indoors or into a ventilated sports arena. ${policy.guidanceText.restricted}`;
      comparisonSummary = "Severe air quality expected throughout both time slots.";
    } else {
      // Planned slot is acceptable or cleaner than alternative
      preferredSlot = "planned";
      if (baselineAqi <= favorableMaxAqi) {
        decisionCategory = "Conditions comparatively more favorable";
        reasonCodes.push("PLANNED_SLOT_FAVORABLE");
        reasons.push(`Planned slot (AQI ${plannedSlot.averageAqi}) is within clean thresholds (≤ ${favorableMaxAqi}).`);
        primaryRecommendation = `Proceed as scheduled with ${policy.displayName.toLowerCase()}. ${policy.guidanceText.favorable}`;
      } else {
        decisionCategory = "Follow applicable official guidance and review conditions";
        reasonCodes.push("HUMAN_REVIEW_REQUIRED");
        reasons.push(`Planned conditions reflect Moderate/Advisory levels (AQI ${plannedSlot.averageAqi}).`);
        primaryRecommendation = policy.guidanceText.advisory;
      }
      comparisonSummary = `Planned window maintains manageable conditions compared to the alternative.`;
    }
  } else {
    // Scenario B: Single Window or Current Observation Only
    comparisonSummary = alternativeSlot ? "" : "No alternative time slot requested for side-by-side comparison.";

    if (baselineAqi <= favorableMaxAqi) {
      decisionCategory = "Conditions comparatively more favorable";
      reasonCodes.push("PLANNED_SLOT_FAVORABLE");
      reasons.push(`Air quality index (${baselineAqi}) is favorable according to ${policy.officialSource}.`);
      primaryRecommendation = `Proceed with planned ${policy.displayName.toLowerCase()}. ${policy.guidanceText.favorable}`;
    } else if (baselineAqi <= advisoryMaxAqi) {
      decisionCategory = "Follow applicable official guidance and review conditions";
      reasonCodes.push("HUMAN_REVIEW_REQUIRED");
      reasons.push(`Air quality index (${baselineAqi}) falls in the advisory range for ${policy.exertionLevel}-exertion.`);
      primaryRecommendation = policy.guidanceText.advisory;
    } else {
      decisionCategory = "Follow applicable official guidance and review conditions";
      reasonCodes.push("HIGH_POLLUTION_RESTRICTION", "HUMAN_REVIEW_REQUIRED");
      reasons.push(
        `Air quality index (${baselineAqi}) exceeds safe threshold (≥ ${restrictionMinAqi}) for ${policy.displayName}.`
      );
      primaryRecommendation = policy.guidanceText.restricted;
    }
  }

  return {
    decisionCategory,
    primaryRecommendation,
    reasonCodes,
    reasons,
    activity: {
      type: input.activityType,
      displayName: policy.displayName,
      exertionLevel: policy.exertionLevel,
      officialPolicySource: policy.officialSource,
    },
    currentConditions,
    slotComparison: {
      plannedSlot,
      alternativeSlot,
      preferredSlot,
      aqiDifference,
      comparisonSummary,
    },
    limitations,
    nextReviewTime,
    dataQuality: {
      hasValidObservation,
      hasHourlyForecast,
      freshnessMinutes,
    },
    generatedAt,
  };
}
