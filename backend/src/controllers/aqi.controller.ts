import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * Helper to determine AQI status category and theme
 */
function getAqiCategory(aqi: number) {
  if (aqi <= 50) return { status: "Good", color: "good", desc: "Air quality is satisfactory and poses little or no risk." };
  if (aqi <= 100) return { status: "Moderate", color: "moderate", desc: "Air quality is acceptable; some pollutants may affect sensitive people." };
  if (aqi <= 150) return { status: "Unhealthy for Sensitive Groups", color: "unhealthy-sensitive", desc: "Members of sensitive groups may experience health effects." };
  if (aqi <= 200) return { status: "Unhealthy", color: "unhealthy", desc: "Everyone may begin to experience health effects." };
  if (aqi <= 300) return { status: "Very Unhealthy", color: "very-unhealthy", desc: "Health alert: everyone may experience serious effects." };
  return { status: "Hazardous", color: "hazardous", desc: "Health warning of emergency conditions." };
}

export async function getLiveAqi(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.6139;
    const lng = parseFloat(req.query.lng as string) || 77.209;

    // 1. Fetch Air Quality from Open-Meteo
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide&hourly=us_aqi,pm2_5&forecast_days=1`;
    
    // 2. Fetch Weather Metrics (temperature, humidity, wind, UV) from Open-Meteo Forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index`;

    const [aqRes, weatherRes] = await Promise.all([
      fetch(airQualityUrl),
      fetch(weatherUrl),
    ]);

    if (!aqRes.ok || !weatherRes.ok) {
      return sendError(res, "Failed to retrieve telemetry from Open-Meteo", 502);
    }

    const aqData:any = await aqRes.json();
    const weatherData:any = await weatherRes.json();

    const currentAq = aqData.current || {};
    const currentWeather = weatherData.current || {};
    const hourlyAq = aqData.hourly || {};

    const aqi = Math.round(currentAq.us_aqi ?? 0);
    const categoryInfo = getAqiCategory(aqi);

    // Format hourly forecast (sample next 8 timestamps)
    const hourlyTimes = (hourlyAq.time as string[]) || [];
    const hourlyAqiValues = (hourlyAq.us_aqi as number[]) || [];
    const forecast = hourlyTimes.slice(0, 8).map((timeStr, idx) => {
      const date = new Date(timeStr);
      const hourAqi = Math.round(hourlyAqiValues[idx] ?? aqi);
      const cat = getAqiCategory(hourAqi);
      return {
        time: idx === 0 ? "Now" : date.toLocaleTimeString([], { hour: "numeric", hour12: true }),
        aqi: hourAqi,
        label: cat.status,
        color: cat.status === "Good" ? "text-emerald-600" : "text-amber-600",
      };
    });

    const responsePayload = {
      location: { lat, lng },
      aqi,
      status: categoryInfo.status,
      statusColor: categoryInfo.color,
      headline: `${categoryInfo.status} Air Quality — US AQI ${aqi}`,
      subtext: categoryInfo.desc,
      pm25: currentAq.pm2_5 ?? 0,
      pm10: currentAq.pm10 ?? 0,
      o3: currentAq.ozone ?? 0,
      no2: currentAq.nitrogen_dioxide ?? 0,
      so2: currentAq.sulphur_dioxide ?? 0,
      co: currentAq.carbon_monoxide ?? 0,
      temp: `${Math.round(currentWeather.temperature_2m ?? 0)}°C`,
      humidity: `${Math.round(currentWeather.relative_humidity_2m ?? 0)}%`,
      wind: `${Math.round(currentWeather.wind_speed_10m ?? 0)} km/h`,
      uv: `UV ${Math.round(currentWeather.uv_index ?? 0)}`,
      forecast,
      updatedAt: new Date().toISOString(),
      source: "Open-Meteo Air Quality & Weather API",
    };

    return sendSuccess(res, responsePayload, "Air quality and weather telemetry retrieved");
  } catch (error: any) {
    return sendError(res, error.message || "Internal server error fetching air quality", 500);
  }
}

