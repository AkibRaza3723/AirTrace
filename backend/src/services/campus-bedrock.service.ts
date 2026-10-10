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
 * Builds the strict, grounded system prompt for the Campus Decision Explanation
 */
function buildExplanationSystemPrompt(decisionResult: CampusDecisionResult): string {
  return `You are BreatheWise Campus Air Intelligence Advisor, assisting college and school administrators.
You are given a VERIFIED, DETERMINISTIC DECISION RESULT produced by the BreatheWise Campus Decision Engine.

RULES & BOUNDARIES:
1. STRICT ADHERENCE: You MUST NOT change or contradict the engine's decision category ("${decisionResult.decisionCategory}") or primary recommendation.
2. NO HALLUCINATION: You MUST NOT invent any AQI numbers, pollutant readings, monitoring stations, or meteorological facts not present in the payload.
3. NO MEDICAL DIAGNOSES: Provide practical, operational campus guidance (e.g., room ventilation, reschedule drills, move indoors, N95 masks for sensitive students). Do NOT certify medical safety or diagnose conditions.
4. UNCERTAINTY TRANSPARENCY: Mention any data limitations, stale readings, or missing forecasts noted in the payload.
5. CONCISE & EMPATHETIC: Structure your explanation into:
   - "Executive Summary": 2 sentences explaining the decision in plain words.
   - "Time Slot Comparison": Why the chosen time slot is comparatively preferable or why both require caution.
   - "Operational Campus Actions": 3 clear bullet points for administrators/students.
   - "Data Attribution & Caveats": 1 sentence noting the monitoring source and limitations.`;
}

/**
 * Generates an authentic, evidence-grounded deterministic fallback explanation
 * if AWS Bedrock credentials are missing or the API call fails.
 */
export function generateDeterministicFallbackExplanation(
  decisionResult: CampusDecisionResult,
  userQuestion?: string
): string {
  const { decisionCategory, primaryRecommendation, reasons, slotComparison, currentConditions, activity } =
    decisionResult;

  const planned = slotComparison.plannedSlot;
  const alt = slotComparison.alternativeSlot;

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
    slotText = `Telemetry relies primarily on current ground station observations (AQI ${currentConditions?.aqi ?? "N/A"}). Forecast models are currently pending fresh updates.`;
  }

  const actions = [
    `Follow campus operational guidelines for ${activity.displayName}: "${primaryRecommendation}".`,
    `Notify faculty, coaches, and attendees regarding current air telemetry (${currentConditions?.prominentPollutant ? `Prominent pollutant: ${currentConditions.prominentPollutant}` : "CPCB NAQI Index"}).`,
    `Ensure indoor facilities maintain closed windows with HEPA filtration if activities are shifted indoors.`,
  ];

  if (userQuestion) {
    actions.push(`In response to your query ("${userQuestion}"): Our recommendations are strictly tied to the verified CPCB standards and current atmospheric readings.`);
  }

  return `### Executive Summary
The Campus Decision Engine has designated this window as **"${decisionCategory}"**. ${primaryRecommendation}

### Time Slot Analysis
${slotText}

### Operational Campus Actions
${actions.map((a) => `- ${a}`).join("\n")}

### Data Attribution & Caveats
Readings sourced from ${currentConditions?.source || "Official CPCB / Open-Meteo Air Quality Telemetry"}${currentConditions?.distanceKm ? ` (${currentConditions.distanceKm} km from campus)` : ""}. Telemetry is designed for operational administrative guidance, not certified clinical assessment.`;
}

/**
 * Explains a campus decision using AWS Bedrock Converse API, with automatic fallback
 */
export async function explainCampusDecisionWithBedrock(
  decisionResult: CampusDecisionResult,
  userQuestion?: string
): Promise<{
  explanation: string;
  isAiGenerated: boolean;
  modelId: string;
  usedFallbackReason?: string;
}> {
  const client = getBedrockClient();

  if (!client) {
    return {
      explanation: generateDeterministicFallbackExplanation(decisionResult, userQuestion),
      isAiGenerated: false,
      modelId: "deterministic-rule-engine-fallback",
      usedFallbackReason: "AWS Bedrock credentials not configured in environment (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY).",
    };
  }

  try {
    const systemPrompt = buildExplanationSystemPrompt(decisionResult);
    const modelId = env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";

    const promptMessage = `Please explain the following campus air quality decision:
Decision Payload:
${JSON.stringify(decisionResult, null, 2)}
${userQuestion ? `\nUser Query: "${userQuestion}"` : ""}
Provide a structured, grounded explanation following the required sections.`;

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
        temperature: 0.2, // Low temperature for factual consistency
        topP: 0.9,
      },
    });

    const response = await client.send(command);
    const replyText = response.output?.message?.content?.[0]?.text;

    if (!replyText || replyText.trim().length === 0) {
      throw new Error("Empty response returned by AWS Bedrock");
    }

    return {
      explanation: replyText,
      isAiGenerated: true,
      modelId,
    };
  } catch (error: any) {
    console.warn("Bedrock explanation call failed, falling back to deterministic explanation:", error.message);
    return {
      explanation: generateDeterministicFallbackExplanation(decisionResult, userQuestion),
      isAiGenerated: false,
      modelId: "deterministic-rule-engine-fallback",
      usedFallbackReason: `Bedrock service call failed: ${error.message || "Unknown error"}`,
    };
  }
}
