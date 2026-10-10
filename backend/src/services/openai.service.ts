import { env } from "../config/env.js";

export interface RouteHealthAssessmentInput {
  originName: string;
  destinationName: string;
  travelMode: "driving" | "cycling" | "walking";
  routes: Array<{
    index: number;
    label: string;
    distanceKm: number;
    durationMin: number;
    averageAqi: number;
    peakAqi: number;
    exposureIndex: number;
    pm2_5: number | null;
    no2: number | null;
    category: string;
  }>;
}

export interface RouteAiHealthReport {
  recommendedRouteIndex: number;
  verdictHeadline: string;
  clinicalTradeoff: string;
  routeSpecificInsights: Array<{
    index: number;
    healthTag: string;
    lungImpact: string;
    hotspotWarning?: string;
  }>;
  vulnerableGroupsAdvice: {
    asthmaAndRespiratory: string;
    childrenAndElderly: string;
    activeCommuters: string;
  };
  protectiveActions: string[];
  aiProvider: string;
  model: string;
  isMockFallback: boolean;
}

/**
 * Generates an end-to-end AI clinical health analysis for alternative routes.
 * Uses OpenAI API (gpt-4o-mini) when OPENAI_API_KEY is configured in .env.
 * Gracefully falls back to deterministic rule-based health heuristics when key is not yet set.
 */
export async function generateRouteAiHealthAssessment(
  input: RouteHealthAssessmentInput
): Promise<RouteAiHealthReport> {
  const { originName, destinationName, travelMode, routes } = input;

  // Find lowest exposure and fastest routes mathematically
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
  const timeDifferenceMin = healthiest && fastest ? healthiest.durationMin - fastest.durationMin : 0;

  // Check if OpenAI API Key is configured
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0) {
    try {
      const systemPrompt = `You are BreatheWise AI, an expert Environmental Health & Inhalation Toxicologist.
Analyze the user's alternative travel routes between "${originName}" and "${destinationName}" (${travelMode} mode).
Your goal is to judge which route minimizes lung inflammation and cumulative particulate inhalation.

Always return valid JSON matching this schema:
{
  "recommendedRouteIndex": <number>,
  "verdictHeadline": "<concise 1-sentence verdict comparing health vs time>",
  "clinicalTradeoff": "<2-sentence scientific explanation of concentration vs transit duration>",
  "routeSpecificInsights": [
    {
      "index": <number>,
      "healthTag": "<short badge e.g. Health-Optimal or High Diesel Hotspot>",
      "lungImpact": "<short description of respiratory impact>",
      "hotspotWarning": "<optional note if peak AQI is elevated>"
    }
  ],
  "vulnerableGroupsAdvice": {
    "asthmaAndRespiratory": "<specific guidance for asthmatics/COPD>",
    "childrenAndElderly": "<specific guidance for children/seniors>",
    "activeCommuters": "<specific guidance for pedestrians/cyclists>"
  },
  "protectiveActions": [
    "<practical mitigation step 1>",
    "<practical mitigation step 2>"
  ]
}`;

      const userPrompt = `Compare these alternative routes for a ${travelMode} commuter:
${routes
  .map(
    (r) =>
      `Route ${String.fromCharCode(65 + r.index)} (${r.label}):
- Distance: ${r.distanceKm} km | Duration: ${r.durationMin} mins
- Average AQI: ${r.averageAqi} (${r.category})
- Peak Hotspot AQI: ${r.peakAqi}
- Average PM2.5: ${r.pm2_5 ?? "N/A"} µg/m³ | NO2: ${r.no2 ?? "N/A"} µg/m³
- Cumulative Exposure Score: ${r.exposureIndex}`
  )
  .join("\n\n")}`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY.trim()}`,
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            recommendedRouteIndex:
              typeof parsed.recommendedRouteIndex === "number"
                ? parsed.recommendedRouteIndex
                : lowestExposureIdx,
            verdictHeadline: parsed.verdictHeadline || "Health analysis computed via OpenAI.",
            clinicalTradeoff: parsed.clinicalTradeoff || "",
            routeSpecificInsights: parsed.routeSpecificInsights || [],
            vulnerableGroupsAdvice: parsed.vulnerableGroupsAdvice || {
              asthmaAndRespiratory: "Monitor shortness of breath.",
              childrenAndElderly: "Prefer the route with lowest exposure score.",
              activeCommuters: "Wear protective filtration during peak transit.",
            },
            protectiveActions: parsed.protectiveActions || [
              "Keep vehicle cabin air on recirculate mode.",
              "Wear an N95 mask if walking or cycling.",
            ],
            aiProvider: "OpenAI",
            model: env.OPENAI_MODEL || "gpt-4o-mini",
            isMockFallback: false,
          };
        }
      } else {
        console.warn(`OpenAI API returned status ${res.status}. Falling back to algorithmic heuristics.`);
      }
    } catch (err: any) {
      console.warn("OpenAI API call failed, falling back to algorithmic report:", err?.message || err);
    }
  }

  // ─── Heuristic Fallback Engine (Zero Crash when OPENAI_API_KEY is pending) ─────
  const isHealthyDifferentFromFastest = lowestExposureIdx !== fastestIdx && exposureSavingPercent >= 10;

  const headline = isHealthyDifferentFromFastest
    ? `Take Route ${String.fromCharCode(65 + lowestExposureIdx)}: You reduce cumulative respiratory dose by ${exposureSavingPercent}% for a ${timeDifferenceMin}-minute difference.`
    : `Route ${String.fromCharCode(65 + fastestIdx)} is recommended: It combines the shortest travel time with the lowest overall inhaled particulate burden.`;

  const tradeoff = isHealthyDifferentFromFastest
    ? `Even though Route ${String.fromCharCode(65 + fastestIdx)} is ${timeDifferenceMin} min faster, its higher pollutant density results in greater total particulate deposition in the alveoli. Route ${String.fromCharCode(65 + lowestExposureIdx)} offers significantly cleaner inhalation.`
    : `Total inhaled dose depends on both air concentration and duration. Here, the fastest route minimizes total inhalation time without entering severe hotspots.`;

  const routeInsights = routes.map((r) => {
    const isLowest = r.index === lowestExposureIdx;
    const isFast = r.index === fastestIdx;
    let tag = "Standard Transit Path";
    if (isLowest && isFast) tag = "Optimal: Cleanest & Fastest";
    else if (isLowest) tag = "Health-Optimal (Lowest Inhaled Dose)";
    else if (isFast) tag = "Fastest Transit (Higher Inhalation)";

    let hotspotWarning: string | undefined;
    if (r.peakAqi > 200) {
      hotspotWarning = `Contains high peak pollution segment (AQI ${r.peakAqi}). Sensitive individuals should avoid this stretch.`;
    }

    return {
      index: r.index,
      healthTag: tag,
      lungImpact: `Cumulative exposure index of ${r.exposureIndex} based on ${r.durationMin} min transit.`,
      hotspotWarning,
    };
  });

  return {
    recommendedRouteIndex: lowestExposureIdx,
    verdictHeadline: headline,
    clinicalTradeoff: tradeoff,
    routeSpecificInsights: routeInsights,
    vulnerableGroupsAdvice: {
      asthmaAndRespiratory:
        "High PM2.5 and NO2 trigger airway hyperreactivity. Avoid corridors with peak hotspots over 180 AQI.",
      childrenAndElderly:
        "Developing and aged lungs absorb fine particulates deeper. Choose the route tagged 'Health-Optimal'.",
      activeCommuters:
        travelMode === "cycling" || travelMode === "walking"
          ? "Minute ventilation increases 2-3x during physical exertion, multiplying inhaled dose. Prioritize low-pollution paths over speed."
          : "In-cabin recirculate mode can filter out 60-80% of ambient particulates.",
    },
    protectiveActions: [
      travelMode === "driving"
        ? "Engage vehicle cabin air recirculation with active HEPA/cabin filter."
        : "Wear an airtight N95/FFP2 respirator to filter fine particulate matter (PM2.5).",
      "Avoid travel during the early morning rush hour inversion when ground pollutants are trapped.",
    ],
    aiProvider: "BreatheWise Health Engine (OpenAI Ready)",
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    isMockFallback: true,
  };
}
