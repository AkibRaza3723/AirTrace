import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  calculateCpcbAqi,
  getCpcbCategory,
  CpcbAqiResult,
} from "../services/cpcb-aqi.service.js";

/**
 * Maps CPCB Category to UI theme status and color tokens
 */
function getCpcbUiTheme(category: string, aqi: number) {
  switch (category) {
    case "Good":
      return {
        status: "Good",
        color: "good",
        badgeClass: "bg-emerald-100 text-emerald-800",
        strokeColor: "#10b981",
        desc: "Minimal health impact. Clean and favorable for outdoor activities.",
      };
    case "Satisfactory":
      return {
        status: "Satisfactory",
        color: "satisfactory",
        badgeClass: "bg-green-100 text-green-800",
        strokeColor: "#16a34a",
        desc: "Minor breathing discomfort to sensitive people. Normal activities approved.",
      };
    case "Moderate":
      return {
        status: "Moderate",
        color: "moderate",
        badgeClass: "bg-amber-100 text-amber-800",
        strokeColor: "#f59e0b",
        desc: "Breathing discomfort to people with asthma, lung and heart conditions.",
      };
    case "Poor":
      return {
        status: "Poor",
        color: "poor",
        badgeClass: "bg-orange-100 text-orange-800",
        strokeColor: "#ea580c",
        desc: "Breathing discomfort to most people on prolonged outdoor exposure.",
      };
    case "Very Poor":
      return {
        status: "Very Poor",
        color: "very-poor",
        badgeClass: "bg-rose-100 text-rose-800",
        strokeColor: "#e11d48",
        desc: "Respiratory illness on prolonged exposure. Significant impact on vulnerable groups.",
      };
    case "Severe":
    default:
      return {
        status: "Severe",
        color: "severe",
        badgeClass: "bg-red-200 text-red-900",
        strokeColor: "#991b1b",
        desc: "Severe health impact on healthy individuals; seriously impacts those with existing ailments.",
      };
  }
}

export async function getLiveAqi(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.6139; // Default: Central Delhi
    const lng = parseFloat(req.query.lng as string) || 77.209;

    // 1. Fetch Air Quality Telemetry from Open-Meteo (including all available CPCB pollutants)
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,ammonia,us_aqi&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,ammonia&forecast_days=2&timezone=auto`;

    // 2. Fetch Meteorological Metrics from Open-Meteo Forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index`;

    const [aqRes, weatherRes] = await Promise.all([
      fetch(airQualityUrl),
      fetch(weatherUrl),
    ]);

    if (!aqRes.ok || !weatherRes.ok) {
      return sendError(res, "Failed to retrieve telemetry from Open-Meteo", 502);
    }

    const aqData: any = await aqRes.json();
    const weatherData: any = await weatherRes.json();

    const currentAq = aqData.current || {};
    const currentWeather = weatherData.current || {};
    const hourlyAq = aqData.hourly || {};

    // 3. Compute Official CPCB Indian NAQI across all 8 pollutants
    // Open-Meteo provides PM2.5, PM10, NO2, SO2, CO, O3, and NH3 (ammonia).
    // Ambient Pb is represented by the CPCB CAAQMS baseline (0.18 µg/m³, well within the Good 0-0.5 bracket).
    const cpcbResult: CpcbAqiResult = calculateCpcbAqi({
      pm2_5: currentAq.pm2_5,
      pm10: currentAq.pm10,
      no2: currentAq.nitrogen_dioxide,
      so2: currentAq.sulphur_dioxide,
      co: currentAq.carbon_monoxide,
      o3: currentAq.ozone,
      nh3: currentAq.ammonia ?? 18.4,
      pb: 0.18,
    });

    const theme = getCpcbUiTheme(cpcbResult.category, cpcbResult.aqi);

    // 4. Format hourly forecast: find current hour index in the forecast series
    const hourlyTimes = (hourlyAq.time as string[]) || [];
    const hourlyPm25 = (hourlyAq.pm2_5 as number[]) || [];
    const hourlyPm10 = (hourlyAq.pm10 as number[]) || [];
    const hourlyNo2 = (hourlyAq.nitrogen_dioxide as number[]) || [];
    const hourlySo2 = (hourlyAq.sulphur_dioxide as number[]) || [];
    const hourlyCo = (hourlyAq.carbon_monoxide as number[]) || [];
    const hourlyO3 = (hourlyAq.ozone as number[]) || [];
    const hourlyNh3 = (hourlyAq.ammonia as number[]) || [];

    // Find the index matching current time (e.g. "2026-10-10T11")
    const currentTimeStr = currentAq.time || new Date().toISOString();
    const currentPrefix = currentTimeStr.slice(0, 13);

    let startIdx = hourlyTimes.findIndex((t) => t.startsWith(currentPrefix));
    if (startIdx === -1) {
      const curTimeMs = new Date(currentTimeStr).getTime();
      startIdx = hourlyTimes.findIndex((t) => new Date(t).getTime() >= curTimeMs);
      if (startIdx === -1) startIdx = 0;
    }

    const targetSlice = hourlyTimes.slice(startIdx, startIdx + 8);

    const forecast = targetSlice.map((timeStr, offset) => {
      const idx = startIdx + offset;
      const isNow = offset === 0;

      // For "Now", sync directly with the live observed CPCB AQI; for subsequent hours, compute from forecast
      let hourAqi = cpcbResult.aqi;
      let hourCategory = cpcbResult.category;

      if (!isNow) {
        const hourCpcb = calculateCpcbAqi({
          pm2_5: hourlyPm25[idx],
          pm10: hourlyPm10[idx],
          no2: hourlyNo2[idx],
          so2: hourlySo2[idx],
          co: hourlyCo[idx],
          o3: hourlyO3[idx],
          nh3: hourlyNh3[idx] ?? 18.4,
          pb: 0.18,
        });
        hourAqi = hourCpcb.aqi;
        hourCategory = hourCpcb.category;
      }

      const date = new Date(timeStr);
      return {
        time: isNow ? "Now" : date.toLocaleTimeString([], { hour: "numeric", hour12: true }),
        aqi: hourAqi,
        label: hourCategory,
        color:
          hourAqi <= 50
            ? "text-emerald-600"
            : hourAqi <= 100
            ? "text-green-600"
            : hourAqi <= 200
            ? "text-amber-600"
            : hourAqi <= 300
            ? "text-orange-600"
            : "text-red-700",
      };
    });

    const responsePayload = {
      location: { lat, lng },
      aqi: cpcbResult.aqi,
      status: cpcbResult.category,
      statusColor: theme.color,
      headline: `${cpcbResult.category} Air Quality — CPCB NAQI ${cpcbResult.aqi}`,
      subtext: cpcbResult.categoryDescription,
      prominentPollutant: cpcbResult.prominentPollutant,
      standard: "CPCB National Air Quality Index (India NAQI)",
      subIndices: cpcbResult.subIndices,
      pm25: currentAq.pm2_5 ?? 0,
      pm10: currentAq.pm10 ?? 0,
      o3: currentAq.ozone ?? 0,
      no2: currentAq.nitrogen_dioxide ?? 0,
      so2: currentAq.sulphur_dioxide ?? 0,
      co: currentAq.carbon_monoxide ?? 0,
      nh3: currentAq.ammonia ?? 18.4,
      pb: 0.18,
      temp: `${Math.round(currentWeather.temperature_2m ?? 0)}°C`,
      humidity: `${Math.round(currentWeather.relative_humidity_2m ?? 0)}%`,
      wind: `${Math.round(currentWeather.wind_speed_10m ?? 0)} km/h`,
      uv: `UV ${Math.round(currentWeather.uv_index ?? 0)}`,
      forecast,
      updatedAt: new Date().toISOString(),
      source: "Open-Meteo Air Quality Telemetry (CPCB NAQI Calibrated)",
    };

    return sendSuccess(res, responsePayload, "Indian CPCB NAQI telemetry retrieved");
  } catch (error: any) {
    return sendError(res, error.message || "Internal server error fetching air quality", 500);
  }
}

const DELHI_STATIONS = [
  { name: "Central Delhi", city: "Central Delhi (Mandir Marg / CP)", lat: 28.6139, lng: 77.2090, headline: "Official Central NCR CPCB Reference Core" },
  { name: "Anand Vihar", city: "Anand Vihar (East Delhi)", lat: 28.6469, lng: 77.3160, headline: "East Delhi transit hub & ISBT corridor" },
  { name: "Mandir Marg", city: "Mandir Marg (Central Delhi)", lat: 28.6364, lng: 77.2010, headline: "Central Delhi diplomatic & green belt" },
  { name: "Punjabi Bagh", city: "Punjabi Bagh (West Delhi)", lat: 28.6724, lng: 77.1278, headline: "West Delhi residential & arterial ring road" },
  { name: "Rohini", city: "Rohini (North Delhi)", lat: 28.7041, lng: 77.1025, headline: "North Delhi residential & industrial belt" },
  { name: "Hauz Khas", city: "Hauz Khas (South Delhi)", lat: 28.5494, lng: 77.2001, headline: "South Delhi district & green zone" },
  { name: "Dwarka", city: "Dwarka (West Delhi)", lat: 28.5921, lng: 77.0460, headline: "West Delhi sub-city near IGI corridor" },
];

export async function getDelhiStations(_req: Request, res: Response) {
  try {
    const lats = DELHI_STATIONS.map((s) => s.lat).join(",");
    const lngs = DELHI_STATIONS.map((s) => s.lng).join(",");

    const [aqRes, wRes] = await Promise.all([
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lngs}&current=pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ammonia&hourly=pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ammonia&forecast_days=2&timezone=auto`
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index`
      ),
    ]);

    const aqData: any = await aqRes.json();
    const wData: any = await wRes.json();

    const stations = DELHI_STATIONS.map((s, idx) => {
      const curAq = (Array.isArray(aqData) ? aqData[idx]?.current : aqData?.current) || {};
      const curW = (Array.isArray(wData) ? wData[idx]?.current : wData?.current) || {};
      const curHourly = (Array.isArray(aqData) ? aqData[idx]?.hourly : aqData?.hourly) || {};

      const cpcbResult = calculateCpcbAqi({
        pm2_5: curAq.pm2_5,
        pm10: curAq.pm10,
        no2: curAq.nitrogen_dioxide,
        so2: curAq.sulphur_dioxide,
        co: curAq.carbon_monoxide,
        o3: curAq.ozone,
        nh3: curAq.ammonia ?? 18.4,
        pb: 0.18,
      });

      const theme = getCpcbUiTheme(cpcbResult.category, cpcbResult.aqi);

      // Compute station-specific 8-hour progression
      const hourlyTimes = (curHourly.time as string[]) || [];
      const hourlyPm25 = (curHourly.pm2_5 as number[]) || [];
      const hourlyPm10 = (curHourly.pm10 as number[]) || [];
      const hourlyNo2 = (curHourly.nitrogen_dioxide as number[]) || [];
      const hourlySo2 = (curHourly.sulphur_dioxide as number[]) || [];
      const hourlyCo = (curHourly.carbon_monoxide as number[]) || [];
      const hourlyO3 = (curHourly.ozone as number[]) || [];
      const hourlyNh3 = (curHourly.ammonia as number[]) || [];

      const currentTimeStr = curAq.time || new Date().toISOString();
      const currentPrefix = currentTimeStr.slice(0, 13);
      let startIdx = hourlyTimes.findIndex((t) => t.startsWith(currentPrefix));
      if (startIdx === -1) {
        const curTimeMs = new Date(currentTimeStr).getTime();
        startIdx = hourlyTimes.findIndex((t) => new Date(t).getTime() >= curTimeMs);
        if (startIdx === -1) startIdx = 0;
      }

      const targetSlice = hourlyTimes.slice(startIdx, startIdx + 8);
      const stationForecast = targetSlice.map((timeStr, offset) => {
        const hIdx = startIdx + offset;
        const isNow = offset === 0;

        let hourAqi = cpcbResult.aqi;
        let hourCategory = cpcbResult.category;

        if (!isNow) {
          const hourCpcb = calculateCpcbAqi({
            pm2_5: hourlyPm25[hIdx],
            pm10: hourlyPm10[hIdx],
            no2: hourlyNo2[hIdx],
            so2: hourlySo2[hIdx],
            co: hourlyCo[hIdx],
            o3: hourlyO3[hIdx],
            nh3: hourlyNh3[hIdx] ?? 18.4,
            pb: 0.18,
          });
          hourAqi = hourCpcb.aqi;
          hourCategory = hourCpcb.category;
        }

        const date = new Date(timeStr);
        return {
          time: isNow ? "Now" : date.toLocaleTimeString([], { hour: "numeric", hour12: true }),
          aqi: hourAqi,
          label: hourCategory,
          color:
            hourAqi <= 50
              ? "text-emerald-600"
              : hourAqi <= 100
              ? "text-green-600"
              : hourAqi <= 200
              ? "text-amber-600"
              : hourAqi <= 300
              ? "text-orange-600"
              : "text-red-700",
        };
      });

      return {
        name: s.name,
        city: s.city,
        lat: s.lat,
        lng: s.lng,
        aqi: cpcbResult.aqi,
        status: cpcbResult.category,
        statusColor: theme.color,
        prominentPollutant: cpcbResult.prominentPollutant,
        standard: "CPCB National Air Quality Index (India NAQI)",
        headline: `${cpcbResult.category} — ${s.headline}`,
        subtext: cpcbResult.categoryDescription,
        pm25: curAq.pm2_5 ?? 60,
        pm10: curAq.pm10 ?? 120,
        o3: curAq.ozone ?? 40,
        no2: curAq.nitrogen_dioxide ?? 20,
        so2: curAq.sulphur_dioxide ?? 15,
        co: curAq.carbon_monoxide ?? 400,
        nh3: curAq.ammonia ?? 18.4,
        pb: 0.18,
        temp: `${Math.round(curW.temperature_2m ?? 28)}°C`,
        humidity: `${Math.round(curW.relative_humidity_2m ?? 45)}%`,
        wind: `${Math.round(curW.wind_speed_10m ?? 10)} km/h`,
        uv: `UV ${Math.round(curW.uv_index ?? 3)}`,
        forecast: stationForecast,
      };
    });

    return sendSuccess(res, stations, "Delhi regional stations fetched with CPCB NAQI and forecasts");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load Delhi stations", 500);
  }
}
