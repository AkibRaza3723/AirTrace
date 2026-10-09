import { Request, Response } from "express";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { env } from "../config/env.js";
import { sendSuccess, sendError } from "../utils/response.js";

// Initialize Bedrock Runtime Client
function getBedrockClient() {
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
 * Builds the tailored System Prompt injecting live environmental metrics and strict guardrails.
 */
function buildSystemPrompt(telemetry: any) {
  const {
    location = "Unknown Location",
    aqi = "N/A",
    status = "Unknown",
    pm25 = "N/A",
    pm10 = "N/A",
    o3 = "N/A",
    temp = "N/A",
    humidity = "N/A",
    wind = "N/A",
    uv = "N/A",
  } = telemetry || {};

  return `You are BreatheWise AI, an expert Environmental & Air Quality Health Advisor.
Your mission is to provide actionable, evidence-based guidance based on real-time atmospheric telemetry to help people protect their lungs and optimize their daily routines.

CURRENT LIVE ENVIRONMENTAL CONDITIONS:
- Location / Coordinates: ${JSON.stringify(location)}
- Overall Air Quality Index (US AQI): ${aqi} (${status})
- Fine Particulate Matter (PM2.5): ${pm25} µg/m³
- Coarse Particulate Matter (PM10): ${pm10} µg/m³
- Ground-Level Ozone (O₃): ${o3} µg/m³
- Ambient Temperature: ${temp}
- Relative Humidity: ${humidity}
- Surface Wind: ${wind}
- UV Radiation Index: ${uv}

STRICT GUARDRAILS & CORE BEHAVIOR RULES:
1. AIR QUALITY & ENVIRONMENTAL HEALTH ONLY:
   You are an air intelligence specialist. You MUST ONLY discuss air quality, particulate pollution, smoke, smog, pollen, weather impact on breathing, ventilation (HEPA purifiers, windows), masks (N95/KN95/surgical), and safe outdoor activity windows.
2. REFUSE UNRELATED / RANDOM TOPICS:
   Do NOT behave like a generic conversational chatbot. If the user asks about coding, movies, gaming, math, history, dating, politics, or any topic unrelated to air, weather, or respiratory safety, politely reject the query with a message such as:
   "I am BreatheWise's specialized Air Intelligence Advisor. I can only assist with air quality, pollution exposure, respiratory safety, and atmospheric conditions."
3. GROUNDED IN TELEMETRY:
   Always ground your answers in the live telemetry provided above. When recommending an action (e.g., whether to run, open windows, or wear an N95), explicitly reference the relevant current numbers (e.g. AQI ${aqi}, PM2.5 ${pm25} µg/m³).
4. ACTIONABLE ADVICE:
   Provide clear, practical next steps:
   - Exercise: recommend safe times of day (avoid rush hour or midday peak ozone).
   - Indoors: specify whether to crack windows for fresh air or seal and turn on air purifiers.
   - Protection: recommend whether particulate filtration (N95 mask) is necessary.
5. NO FORMAL CLINICAL DIAGNOSES:
   Offer preventative lifestyle guidance, but remind users to consult a doctor or healthcare professional for acute medical emergencies. Keep your tone concise, scientific, empathetic, and clear.`;
}

export async function askAirAssistant(req: Request, res: Response) {
  try {
    const { message, history = [], telemetry } = req.body;

    if (!message || typeof message !== "string") {
      return sendError(res, "Message query is required", 400);
    }

    const client = getBedrockClient();

    // If AWS credentials are not yet set up in .env, return a helpful setup notice
    if (!client) {
      return sendSuccess(res, {
        reply: `⚠️ AWS Bedrock credentials are not configured in your backend .env file yet. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in backend/.env to connect to your live AWS Bedrock model (Current AQI: ${telemetry?.aqi ?? 34}, PM2.5: ${telemetry?.pm25 ?? 8.1} µg/m³).`,
        telemetryUsed: telemetry,
        timestamp: new Date().toISOString(),
      });
    }

    const systemPrompt = buildSystemPrompt(telemetry);

    // Format conversation messages for AWS Bedrock Converse API
    const formattedMessages = [
      ...history.slice(-6).map((h: any) => ({
        role: h.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: [{ text: h.text }],
      })),
      {
        role: "user" as const,
        content: [{ text: message }],
      },
    ];

    const command = new ConverseCommand({
      modelId: env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0",
      system: [{ text: systemPrompt }],
      messages: formattedMessages,
      inferenceConfig: {
        maxTokens: 600,
        temperature: 0.3,
      },
    });

    const response = await client.send(command);
    const replyText =
      response.output?.message?.content?.[0]?.text ||
      "Unable to process environmental telemetry at this time.";

    return sendSuccess(res, {
      reply: replyText,
      telemetryUsed: telemetry,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AWS Bedrock Assistant Error:", error);
    return sendError(
      res,
      error.message || "Failed to generate AI response from AWS Bedrock",
      500
    );
  }
}
