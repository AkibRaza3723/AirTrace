import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { env } from "../config/env.js";
import { CampusDecisionResult } from "./campus-decision.engine.js";

function getBedrockClient(): BedrockRuntimeClient | null {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }
  return new BedrockRuntimeClient({
    region: env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Builds the comprehensive, grounded system prompt injecting complete real-time pollutant
 * concentrations, CPCB NAQI scores, regulatory thresholds (GRAP, NPCCHH), and campus activity rules.
 */
function buildExplanationSystemPrompt(decisionResult: CampusDecisionResult): string {
  const { currentConditions, activity, slotComparison, decisionCategory, primaryRecommendation, reasons, campusName, coordinates } =
    decisionResult;

  const current = currentConditions;
  const planned = slotComparison?.plannedSlot;
  const alt = slotComparison?.alternativeSlot;
  const resolvedCampusName = campusName || "Student Campus";

  return `You are BreatheWise Campus Air Intelligence Advisor, an expert institutional environmental health and safety consultant assisting school principals, athletic directors, collegiate administrators, teachers, and students.

CURRENT REAL-TIME CAMPUS ENVIRONMENTAL TELEMETRY:
- Registered Campus / Institution: ${resolvedCampusName}
- Campus Coordinates: ${coordinates ? `${coordinates.lat.toFixed(4)}°N, ${coordinates.lng.toFixed(4)}°E` : "Active Coordinates"}
- Nearest CPCB Reference Air Quality Sensor / Station: ${current?.stationName || "Atmospheric Grid Point"}${current?.distanceKm ? ` (${current.distanceKm} km away from ${resolvedCampusName})` : ""}
- Sensor Station Type: ${current?.isPhysicalStation ? "Physical CPCB CAAQMS Continuous Ambient Station" : "High-Resolution Atmospheric Model Grid"}
- CPCB Indian NAQI (Official Air Quality Index): ${current?.aqi ?? "N/A"} (${current?.category ?? "Unknown"})
- Prominent Pollutant: ${current?.prominentPollutant ?? "Particulate Matter"}
- Fine Particulate Matter (PM2.5): ${current?.pm2_5 !== null && current?.pm2_5 !== undefined ? `${current.pm2_5} µg/m³ (CPCB 24-hr Standard: 60 µg/m³)` : "N/A"}
- Coarse Particulates (PM10): ${current?.pm10 !== null && current?.pm10 !== undefined ? `${current.pm10} µg/m³ (CPCB 24-hr Standard: 100 µg/m³)` : "N/A"}
- Nitrogen Dioxide (NO₂): ${current?.no2 !== null && current?.no2 !== undefined ? `${current.no2} µg/m³ (Standard: 80 µg/m³)` : "N/A"}
- Sulphur Dioxide (SO₂): ${current?.so2 !== null && current?.so2 !== undefined ? `${current.so2} µg/m³` : "N/A"}
- Carbon Monoxide (CO): ${current?.co !== null && current?.co !== undefined ? `${current.co} mg/m³` : "N/A"}
- Ozone (O₃): ${current?.o3 !== null && current?.o3 !== undefined ? `${current.o3} µg/m³` : "N/A"}

SCHEDULED CAMPUS ACTIVITY CONTEXT:
- Target Campus: ${resolvedCampusName}
- Activity Type: ${activity?.displayName || "Campus Outdoor Activity"}
- Exertion Level: ${activity?.exertionLevel || "Standard"}
- Official Regulatory Policy: ${activity?.officialPolicySource || (activity as any)?.officialSource || "CPCB Institutional Guidelines"}
- Planned Schedule Window: ${planned ? `${planned.startTime} - ${planned.endTime} (Forecast Avg AQI: ${planned.averageAqi}, Peak PM2.5: ${planned.peakPm25} µg/m³)` : "Current observation window"}
${alt ? `- Alternative Schedule Window: ${alt.startTime} - ${alt.endTime} (Forecast Avg AQI: ${alt.averageAqi}, Peak PM2.5: ${alt.peakPm25} µg/m³)` : ""}
- Engine Decision Category: "${decisionCategory}"
- Primary Operational Recommendation: "${primaryRecommendation}"
- Evaluation Reasons: ${reasons?.join("; ") || "Evaluated against national environmental criteria"}

CAMPUS REGULATORY STANDARDS & ACTIVITY PERMISSION RULES (CPCB & NPCCHH INDIA):
1. AQI 0–50 (Good): All outdoor sports, assemblies, PE drills, and excursions fully APPROVED.
2. AQI 51–100 (Satisfactory): All standard activities approved. Sensitive/asthmatic students should monitor breathing during vigorous aerobic drills.
3. AQI 101–200 (Moderate): Light/moderate outdoor activities approved. High-intensity competitive athletics (football, track sprints, marathon training) require frequent hydration and rest breaks.
4. AQI 201–300 (Poor): Suspend high-exertion outdoor PE and competitive sports. Outdoor morning assemblies must be shortened or moved indoors. Asthmatic and vulnerable students must remain indoors.
5. AQI 301–400 (Very Poor / GRAP Stage III): Full prohibition of outdoor physical education, assemblies, and sports. Move all activities to indoor facilities with closed windows and active HEPA filtration. Fit N95 masks for outdoor building-to-building transit.
6. AQI 401+ (Severe / GRAP Stage IV): Immediate suspension of all outdoor events. Physical classes may be restricted as per Department of Education / CPCB mandates.

STRICT CONTEXT, IDENTITY & GROUNDING INSTRUCTIONS:
1. THE STUDENT'S CAMPUS IS "${resolvedCampusName}". You MUST address and refer to their institution strictly as "${resolvedCampusName}".
2. DO NOT confuse the monitoring sensor station ("${current?.stationName}") with the campus. Under NO circumstances tell the user that their campus is "${current?.stationName}" or "IIT Delhi" unless their registered campus name is specifically IIT Delhi. "${current?.stationName}" is merely the nearest scientific CPCB sensor providing air data.
3. GROUNDED NUMBERS: Always quote the exact real-time AQI (${current?.aqi ?? "N/A"}) and PM2.5 level (${current?.pm2_5 ?? "N/A"} µg/m³) provided in this prompt. Do not invent or alter these numbers.
4. State clearly whether the activity or request is:
   ✅ APPROVED (Full Permission)
   ⚠️ RESTRICTED / MODIFIED (Requires Precautions)
   🚫 STRICTLY PROHIBITED (Unsafe for Lungs)
5. Provide practical, operational advice: e.g. indoor gymnasiums, ventilation recommendations, rescheduling windows, and protection for asthmatic students.
6. Be clear, empathetic, authoritative, and concise. Use formatted markdown with clear headers and bullet points.`;
}

/**
 * Generates an authentic, evidence-grounded deterministic fallback explanation
 * if AI API keys are not yet configured.
 */
export function generateDeterministicFallbackExplanation(
  decisionResult: CampusDecisionResult,
  userQuestion?: string
): string {
  const { decisionCategory, primaryRecommendation, reasons, slotComparison, currentConditions, activity, campusName } =
    decisionResult;

  const resolvedCampusName = campusName || "Student Campus";
  const planned = slotComparison?.plannedSlot;
  const alt = slotComparison?.alternativeSlot;

  let slotText = "";
  if (planned && alt) {
    if (slotComparison.preferredSlot === "alternative") {
      slotText = `The alternative window (${alt.startTime}–${alt.endTime}) offers a clear reduction in exposure, forecasting an average AQI of ~${alt.averageAqi} (Peak PM2.5: ${alt.peakPm25} µg/m³) versus ~${planned.averageAqi} during the planned window (${planned.startTime}). Rescheduling avoids peak atmospheric accumulation.`;
    } else if (slotComparison.preferredSlot === "planned") {
      slotText = `The planned window (${planned.startTime}–${planned.endTime}) maintains more favorable dispersion conditions (AQI ~${planned.averageAqi}) compared to the alternative window (AQI ~${alt.averageAqi}).`;
    } else {
      slotText = `Both the planned (${planned.startTime}) and alternative (${alt.startTime}) windows register high pollutant levels exceeding standard campus thresholds. Postponement or indoor relocation is advised across both windows.`;
    }
  } else if (planned) {
    slotText = `The planned window (${planned.startTime}–${planned.endTime}) indicates an estimated average AQI of ~${planned.averageAqi} (Peak PM2.5: ${planned.peakPm25} µg/m³).`;
  } else {
    slotText = `Telemetry relies primarily on current ground station observations (AQI ${currentConditions?.aqi ?? "N/A"}, PM2.5: ${currentConditions?.pm2_5 ?? "N/A"} µg/m³).`;
  }

  const actions = [
    `Follow campus operational guidelines for ${activity?.displayName || "Campus Activity"}: "${primaryRecommendation}".`,
    `Current Particulates: PM2.5 at ${currentConditions?.pm2_5 ?? "N/A"} µg/m³, PM10 at ${currentConditions?.pm10 ?? "N/A"} µg/m³ (CPCB Category: ${currentConditions?.category || "Observed"}).`,
    `Ensure indoor facilities maintain closed doors/windows with active filtration if activities are shifted indoors.`,
  ];

  if (userQuestion) {
    actions.push(
      `In response to your query ("${userQuestion}"): Campus policy requires compliance with CPCB NAQI guidelines. Outdoor high-exertion activities are restricted whenever AQI exceeds 200 or PM2.5 exceeds 90 µg/m³.`
    );
  }

  return `### Executive Summary
The Campus Decision Engine has designated this window for **${resolvedCampusName}** as **"${decisionCategory}"**. ${primaryRecommendation}

### Real-Time Atmospheric Conditions
- **Campus Institution**: ${resolvedCampusName}
- **AQI**: ${currentConditions?.aqi ?? "N/A"} (${currentConditions?.category ?? "Unknown"})
- **PM2.5**: ${currentConditions?.pm2_5 ?? "N/A"} µg/m³ | **PM10**: ${currentConditions?.pm10 ?? "N/A"} µg/m³
- **Reference Monitoring Sensor**: ${currentConditions?.stationName || "Local Telemetry Station"}

### Time Slot Analysis
${slotText}

### Operational Campus Actions
${actions.map((a) => `- ${a}`).join("\n")}

### Data Attribution & Caveats
Readings sourced from ${currentConditions?.source || "Official CPCB / Open-Meteo Air Quality Telemetry"}${currentConditions?.distanceKm ? ` (${currentConditions.distanceKm} km from ${resolvedCampusName})` : ""}. Telemetry is designed for institutional guidance.`;
}

/**
 * Explains a campus air decision and answers user queries using AWS Bedrock,
 * with automatic graceful fallback to the deterministic heuristic engine.
 */
export async function explainCampusDecisionWithBedrock(
  decisionResult: CampusDecisionResult,
  userQuestion?: string
): Promise<{
  explanation: string;
  isAiGenerated: boolean;
  provider: "AWS Bedrock" | "Rule Engine";
  modelId: string;
  usedFallbackReason?: string;
}> {
  const systemPrompt = buildExplanationSystemPrompt(decisionResult);

  const promptMessage = userQuestion
    ? `A campus user (administrator, coach, or student) asked the following question:
"${userQuestion}"

Please give a comprehensive, authoritative, and direct answer based on the real-time campus air quality telemetry, pollutant numbers, and regulatory rules in your instructions.`
    : `Please explain the campus air quality evaluation and scheduled activity recommendation based on the current telemetry in your instructions.`;

  // ─── AWS Bedrock Provider ─────────────────────────────────────────────
  const bedrockClient = getBedrockClient();
  if (bedrockClient) {
    try {
      const modelId = env.AWS_BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

      const command = new ConverseCommand({
        modelId,
        system: [{ text: systemPrompt }],
        messages: [
          {
            role: "user",
            content: [{ text: promptMessage }],
          },
        ],
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.2,
          topP: 0.9,
        },
      });

      const response = await bedrockClient.send(command);
      const replyText = response.output?.message?.content?.[0]?.text;

      if (replyText && replyText.trim().length > 0) {
        return {
          explanation: replyText,
          isAiGenerated: true,
          provider: "AWS Bedrock",
          modelId,
        };
      }
    } catch (err: any) {
      console.warn("Bedrock campus explanation failed, falling back to rule engine:", err?.message || err);
    }
  }

  // ─── Deterministic Heuristic Fallback (Zero Crash) ─────────────────
  return {
    explanation: generateDeterministicFallbackExplanation(decisionResult, userQuestion),
    isAiGenerated: false,
    provider: "Rule Engine",
    modelId: "deterministic-rule-engine-fallback",
    usedFallbackReason: "AWS Bedrock unavailable or credentials pending in backend .env. Using verified CPCB rule heuristics.",
  };
}
