/**
 * CPCB Indian National Air Quality Index (NAQI) Calculation Service
 * 
 * Implements the official methodology published by the Central Pollution Control Board (CPCB),
 * Ministry of Environment, Forest and Climate Change, Government of India.
 * 
 * Formula for Sub-Index (I_p):
 *   I_p = [ (I_hi - I_lo) / (B_hi - B_lo) ] * (C_p - B_lo) + I_lo
 * 
 * Overall AQI = max(Sub-Index of all monitored pollutants)
 * The pollutant yielding the maximum sub-index is designated as the "Prominent Pollutant".
 */

export interface PollutantBreakpoints {
  bLo: number;
  bHi: number;
  iLo: number;
  iHi: number;
}

export interface CpcbSubIndexResult {
  pollutant: string;
  concentration: number;
  unit: string;
  subIndex: number;
  category: CpcbCategory;
}

export type CpcbCategory =
  | "Good"
  | "Satisfactory"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe";

export interface CpcbAqiResult {
  aqi: number;
  category: CpcbCategory;
  categoryDescription: string;
  prominentPollutant: string;
  subIndices: Record<string, CpcbSubIndexResult>;
  standard: "CPCB National Air Quality Index (India NAQI)";
  calculatedAt: string;
}

// CPCB Breakpoints table (Concentration vs AQI Range)
// Source: CPCB National Air Quality Index Guidelines, 2014-2015
const CPCB_BREAKPOINTS: Record<string, PollutantBreakpoints[]> = {
  pm2_5: [
    { bLo: 0, bHi: 30, iLo: 0, iHi: 50 },
    { bLo: 31, bHi: 60, iLo: 51, iHi: 100 },
    { bLo: 61, bHi: 90, iLo: 101, iHi: 200 },
    { bLo: 91, bHi: 120, iLo: 201, iHi: 300 },
    { bLo: 121, bHi: 250, iLo: 301, iHi: 400 },
    { bLo: 251, bHi: 500, iLo: 401, iHi: 500 },
  ],
  pm10: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
    { bLo: 51, bHi: 100, iLo: 51, iHi: 100 },
    { bLo: 101, bHi: 250, iLo: 101, iHi: 200 },
    { bLo: 251, bHi: 350, iLo: 201, iHi: 300 },
    { bLo: 351, bHi: 430, iLo: 301, iHi: 400 },
    { bLo: 431, bHi: 600, iLo: 401, iHi: 500 },
  ],
  no2: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50 },
    { bLo: 41, bHi: 80, iLo: 51, iHi: 100 },
    { bLo: 81, bHi: 180, iLo: 101, iHi: 200 },
    { bLo: 181, bHi: 280, iLo: 201, iHi: 300 },
    { bLo: 281, bHi: 400, iLo: 301, iHi: 400 },
    { bLo: 401, bHi: 800, iLo: 401, iHi: 500 },
  ],
  so2: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50 },
    { bLo: 41, bHi: 80, iLo: 51, iHi: 100 },
    { bLo: 81, bHi: 380, iLo: 101, iHi: 200 },
    { bLo: 381, bHi: 800, iLo: 201, iHi: 300 },
    { bLo: 801, bHi: 1600, iLo: 301, iHi: 400 },
    { bLo: 1601, bHi: 2400, iLo: 401, iHi: 500 },
  ],
  co: [
    // Open-Meteo reports CO in µg/m³; CPCB uses mg/m³. Convert µg/m³ -> mg/m³ (/ 1000)
    { bLo: 0, bHi: 1.0, iLo: 0, iHi: 50 },
    { bLo: 1.1, bHi: 2.0, iLo: 51, iHi: 100 },
    { bLo: 2.1, bHi: 10.0, iLo: 101, iHi: 200 },
    { bLo: 10.1, bHi: 17.0, iLo: 201, iHi: 300 },
    { bLo: 17.1, bHi: 34.0, iLo: 301, iHi: 400 },
    { bLo: 34.1, bHi: 50.0, iLo: 401, iHi: 500 },
  ],
  o3: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
    { bLo: 51, bHi: 100, iLo: 51, iHi: 100 },
    { bLo: 101, bHi: 168, iLo: 101, iHi: 200 },
    { bLo: 169, bHi: 208, iLo: 201, iHi: 300 },
    { bLo: 209, bHi: 748, iLo: 301, iHi: 400 },
    { bLo: 749, bHi: 1000, iLo: 401, iHi: 500 },
  ],
};

/**
 * Determine category label from index value
 */
export function getCpcbCategory(aqi: number): { category: CpcbCategory; description: string; colorClass: string } {
  if (aqi <= 50) {
    return {
      category: "Good",
      description: "Minimal health impact. Air quality is clean and favorable for outdoor activities.",
      colorClass: "bg-emerald-500 text-white",
    };
  }
  if (aqi <= 100) {
    return {
      category: "Satisfactory",
      description: "Minor breathing discomfort to sensitive people. Normal outdoor activity acceptable.",
      colorClass: "bg-green-600 text-white",
    };
  }
  if (aqi <= 200) {
    return {
      category: "Moderate",
      description: "Breathing discomfort to people with lungs, asthma and heart diseases.",
      colorClass: "bg-amber-500 text-white",
    };
  }
  if (aqi <= 300) {
    return {
      category: "Poor",
      description: "Breathing discomfort to most people on prolonged outdoor exposure.",
      colorClass: "bg-orange-500 text-white",
    };
  }
  if (aqi <= 400) {
    return {
      category: "Very Poor",
      description: "Respiratory illness on prolonged exposure. Pronounced effect on sensitive individuals.",
      colorClass: "bg-rose-600 text-white",
    };
  }
  return {
    category: "Severe",
    description: "Affects healthy people and seriously impacts those with existing respiratory or cardiac conditions.",
    colorClass: "bg-red-800 text-white",
  };
}

/**
 * Calculates sub-index for a single pollutant concentration
 */
export function calculateSubIndex(pollutant: string, rawConcentration: number): number | null {
  if (rawConcentration === undefined || rawConcentration === null || isNaN(rawConcentration) || rawConcentration < 0) {
    return null;
  }

  const key = pollutant.toLowerCase().replace(".", "_");
  const breakpoints = CPCB_BREAKPOINTS[key];
  if (!breakpoints) return null;

  // CO concentration conversion: if raw value is > 50, assume it was provided in µg/m³ and convert to mg/m³
  let concentration = rawConcentration;
  if (key === "co" && rawConcentration > 50) {
    concentration = rawConcentration / 1000;
  }

  // Find corresponding breakpoint interval
  for (const bp of breakpoints) {
    if (concentration >= bp.bLo && concentration <= bp.bHi) {
      const subIndex = ((bp.iHi - bp.iLo) / (bp.bHi - bp.bLo)) * (concentration - bp.bLo) + bp.iLo;
      return Math.round(subIndex);
    }
  }

  // Exceeds upper limit: clamp to 500 or extrapolate highest bracket
  if (concentration > breakpoints[breakpoints.length - 1].bHi) {
    return 500;
  }

  return 0;
}

/**
 * Calculates overall CPCB Indian NAQI from available pollutant readings
 */
export function calculateCpcbAqi(readings: {
  pm2_5?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  o3?: number | null;
}): CpcbAqiResult {
  const subIndices: Record<string, CpcbSubIndexResult> = {};
  let maxSubIndex = 0;
  let prominent = "None";

  const pollutantConfigs: Array<{ key: string; name: string; unit: string; rawVal?: number | null }> = [
    { key: "pm2_5", name: "PM2.5", unit: "µg/m³", rawVal: readings.pm2_5 },
    { key: "pm10", name: "PM10", unit: "µg/m³", rawVal: readings.pm10 },
    { key: "no2", name: "NO2", unit: "µg/m³", rawVal: readings.no2 },
    { key: "so2", name: "SO2", unit: "µg/m³", rawVal: readings.so2 },
    { key: "co", name: "CO", unit: "mg/m³", rawVal: readings.co },
    { key: "o3", name: "O3", unit: "µg/m³", rawVal: readings.o3 },
  ];

  for (const item of pollutantConfigs) {
    if (item.rawVal !== undefined && item.rawVal !== null && !isNaN(item.rawVal)) {
      const idx = calculateSubIndex(item.key, item.rawVal);
      if (idx !== null) {
        const catInfo = getCpcbCategory(idx);
        subIndices[item.key] = {
          pollutant: item.name,
          concentration: Number(item.rawVal.toFixed(1)),
          unit: item.unit,
          subIndex: idx,
          category: catInfo.category,
        };

        if (idx > maxSubIndex) {
          maxSubIndex = idx;
          prominent = item.name;
        }
      }
    }
  }

  const categoryInfo = getCpcbCategory(maxSubIndex);

  return {
    aqi: maxSubIndex,
    category: categoryInfo.category,
    categoryDescription: categoryInfo.description,
    prominentPollutant: prominent,
    subIndices,
    standard: "CPCB National Air Quality Index (India NAQI)",
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates Great-Circle distance (Haversine formula) in kilometers between two GPS coordinates
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Checks if a timestamp is stale (> 3 hours old)
 */
export function isReadingStale(timestampIso: string, maxAgeHours = 3): boolean {
  try {
    const readingTime = new Date(timestampIso).getTime();
    const now = Date.now();
    const diffHours = (now - readingTime) / (1000 * 60 * 60);
    return diffHours > maxAgeHours;
  } catch {
    return true;
  }
}
