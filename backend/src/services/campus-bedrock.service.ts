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
  const { currentConditions, activity, slotComparison, decisionCategory, primaryRecommendation, reasons } =
    decisionResult;

  const current = currentConditions || {};
  const planned = slotComparison?.plannedSlot;
  const alt = slotComparison?.alternativeSlot;

  return `You are BreatheWise Campus Air Intelligence Advisor, an expert institutional environmental health and safety consultant assisting school principals, athletic directors, collegiate administrators, teachers, and students.

CURRENT REAL-TIME CAMPUS ENVIRONMENTAL TELEMETRY:
- Campus Location: ${current.stationName ? current.stationName : "Campus Coordinates"}
- Monitoring Station: ${current.stationName || "Atmospheric Grid Point"}${current.distanceKm ? ` (${current.distanceKm} km away)` : ""}
- Station Type: ${current.isPhysicalStation ? "Physical CPCB CAAQMS Continuous Ambient Station" : "High-Resolution Atmospheric Model Grid"}
- CPCB Indian NAQI: ${current.aqi ?? "N/A"} (${current.category ?? "Unknown"})
- Prominent Pollutant: ${current.prominentPollutant ?? "Particulate Matter"}
- Particulate Matter (PM2.5): ${current.pm2_5 !== null && current.pm2_5 !== undefined ? `${current.pm2_5} µg/m³ (CPCB 24-hr Standard: 60 µg/m³)` : "N/A"}
- Coarse Particulates (PM10): ${current.pm10 !== null && current.pm10 !== undefined ? `${current.pm10} µg/m³ (CPCB 24-hr Standard: 100 µg/m³)` : "N/A"}
- Nitrogen Dioxide (NO₂): ${current.no2 !== null && current.no2 !== undefined ? `${current.no2} µg/m³ (Standard: 80 µg/m³)` : "N/A"}
- Sulphur Dioxide (SO₂): ${current.so2 !== null && current.so2 !== undefined ? `${current.so2} µg/m³` : "N/A"}
- Carbon Monoxide (CO): ${current.co !== null && current.co !== undefined ? `${current.co} mg/m³` : "N/A"}
- Ozone (O₃): ${current.o3 !== null && current.o3 !== undefined ? `${current.o3} µg/m³` : "N/A"}

SCHEDULED CAMPUS ACTIVITY CONTEXT:
- Activity Type: ${activity?.displayName || "Campus Outdoor Activity"}
- Exertion Level: ${activity?.exertionLevel || "Standard"}
- Official Regulatory Policy: ${activity?.officialSource || "CPCB Institutional Guidelines"}
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

YOUR INSTRUCTIONS:
- You are here to answer ANY questions about campus operations, pollution levels, student health, and allowed activities.
- When answering user questions, ALWAYS refer specifically to the current pollutant readings (e.g. quoting PM2.5: ${current.pm2_5 ?? "N/A"} µg/m³ or AQI: ${current.aqi ?? "N/A"}).
- State clearly whether the activity or request is:
  ✅ APPROVED (Full Permission)
  ⚠️ RESTRICTED / MODIFIED (Requires Precautions)
  🚫 STRICTLY PROHIBITED (Unsafe for Lungs)
- Provide practical, operational advice: e.g. indoor gymnasiums, ventilation recommendations, rescheduling windows, and protection for asthmatic students.
- Be clear, empathetic, authoritative, and concise. Use formatted markdown with clear headers and bullet points.`;
}

/**
 * Generates an authentic, evidence-grounded deterministic fallback explanation
 * if AI API keys are not yet configured.
 */
export function generateDeterministicFallbackExplanation(
  decisionResult: CampusDecisionResult,
  userQuestion?: string
): string {
  const { decisionCategory, primaryRecommendation, reasons, slotComparison, currentConditions, activity } =
    decisionResult;

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

  return `### Executive Campus Air Summary
The Campus Decision Engine has designated this window as **"${decisionCategory}"**. ${primaryRecommendation}

### Real-Time Atmospheric Conditions
- **AQI**: ${currentConditions?.aqi ?? "N/A"} (${currentConditions?.category ?? "Unknown"})
- **PM2.5**: ${currentConditions?.pm2_5 ?? "N/A"} µg/m³ | **PM10**: ${currentConditions?.pm10 ?? "N/A"} µg/m³
- **Monitoring Station**: ${currentConditions?.stationName || "Local Telemetry Station"}

### Time Slot Analysis
${slotText}

### Operational Campus Actions
${actions.map((a) => `- ${a}`).join("\n")}

### Data Attribution & Caveats
Readings sourced from ${currentConditions?.source || "Official CPCB / Open-Meteo Air Quality Telemetry"}${currentConditions?.distanceKm ? ` (${currentConditions.distanceKm} km from campus)` : ""}. Telemetry is designed for institutional guidance.`;
}

/**
 * Explains a campus air decision and answers user queries using OpenAI (GPT-4o-mini)
 * or AWS Bedrock, with automatic graceful fallback.
 */
export async function explainCampusDecisionWithBedrock(
  decisionResult: CampusDecisionResult,
  userQuestion?: string
): Promise<{
  explanation: string;
  isAiGenerated: boolean;
  provider: "OpenAI" | "AWS Bedrock" | "Rule Engine";
  modelId: string;
  usedFallbackReason?: string;
}> {
  const systemPrompt = buildExplanationSystemPrompt(decisionResult);

  const promptMessage = userQuestion
    ? `A campus user (administrator, coach, or student) asked the following question:
"${userQuestion}"

Please give a comprehensive, authoritative, and direct answer based on the real-time campus air quality telemetry, pollutant numbers, and regulatory rules in your instructions.`
    : `Please explain the campus air quality evaluation and scheduled activity recommendation based on the current telemetry in your instructions.`;

  // ─── 1. Primary AI Provider: OpenAI (GPT-4o-mini) ─────────────────────
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0) {
    try {
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
            { role: "user", content: promptMessage },
          ],
          temperature: 0.25,
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.choices?.[0]?.message?.content;
        if (replyText && replyText.trim().length > 0) {
          return {
            explanation: replyText,
            isAiGenerated: true,
            provider: "OpenAI",
            modelId: env.OPENAI_MODEL || "gpt-4o-mini",
          };
        }
      }
    } catch {
      // Fallback silently to secondary provider
    }
  }

  // ─── 2. Secondary AI Provider: AWS Bedrock Claude ─────────────────────
  const bedrockClient = getBedrockClient();
  if (bedrockClient) {
    try {
      const modelId = env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";

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
    } catch {
      // Fallback silently to deterministic heuristic
    }
  }

  // ─── 3. Deterministic Heuristic Fallback (Zero Crash) ─────────────────
  return {
    explanation: generateDeterministicFallbackExplanation(decisionResult, userQuestion),
    isAiGenerated: false,
    provider: "Rule Engine",
    modelId: "deterministic-rule-engine-fallback",
    usedFallbackReason: env.OPENAI_API_KEY
      ? "AI service temporarily unreachable. Generated via BreatheWise Rule Engine."
      : "OpenAI API key pending in backend .env (OPENAI_API_KEY). Using verified CPCB rule heuristics.",
  };
}
