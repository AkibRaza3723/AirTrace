import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSubIndex,
  calculateCpcbAqi,
  getCpcbCategory,
  calculateHaversineDistanceKm,
  isReadingStale,
} from "../services/cpcb-aqi.service.js";
import {
  evaluateCampusDecision,
  validateCampusDecisionInput,
  CampusDecisionInput,
  HourlyForecastPoint,
} from "../services/campus-decision.engine.js";
import { generateDeterministicFallbackExplanation } from "../services/campus-bedrock.service.js";

test("CPCB NAQI Sub-Index Calculations", async (t) => {
  await t.test("PM2.5 sub-index conforms to official CPCB breakpoints", () => {
    // 0-30 -> 0-50 (Good)
    const idx15 = calculateSubIndex("pm2_5", 15);
    assert.equal(idx15, 25);

    // 31-60 -> 51-100 (Satisfactory)
    const idx45 = calculateSubIndex("pm2_5", 45);
    assert.ok(idx45 !== null && idx45 >= 51 && idx45 <= 100);

    // 61-90 -> 101-200 (Moderate)
    const idx75 = calculateSubIndex("pm2_5", 75);
    assert.ok(idx75 !== null && idx75 >= 101 && idx75 <= 200);

    // 91-120 -> 201-300 (Poor)
    const idx105 = calculateSubIndex("pm2_5", 105);
    assert.ok(idx105 !== null && idx105 >= 201 && idx105 <= 300);

    // 121-250 -> 301-400 (Very Poor)
    const idx180 = calculateSubIndex("pm2_5", 180);
    assert.ok(idx180 !== null && idx180 >= 301 && idx180 <= 400);

    // 251-500 -> 401-500 (Severe)
    const idx350 = calculateSubIndex("pm2_5", 350);
    assert.ok(idx350 !== null && idx350 >= 401 && idx350 <= 500);
  });

  await t.test("PM10 sub-index conforms to official CPCB breakpoints", () => {
    // 0-50 -> 0-50 (Good)
    assert.equal(calculateSubIndex("pm10", 25), 25);
    // 51-100 -> 51-100 (Satisfactory)
    assert.equal(calculateSubIndex("pm10", 75), 75);
  });

  await t.test("Overall AQI selects maximum sub-index and identifies prominent pollutant", () => {
    const result = calculateCpcbAqi({
      pm2_5: 80, // Moderate (~166)
      pm10: 40,  // Good (40)
      no2: 20,   // Good (25)
    });

    assert.ok(result.aqi >= 150);
    assert.equal(result.prominentPollutant, "PM2.5");
    assert.equal(result.category, "Moderate");
  });

  await t.test("Invalid or missing concentrations return null safely", () => {
    assert.equal(calculateSubIndex("pm2_5", -10), null);
    assert.equal(calculateSubIndex("pm2_5", NaN), null);
  });
});

test("Haversine Distance and Stale Data Check", async (t) => {
  await t.test("Calculates accurate distance between Delhi coordinates", () => {
    // Distance between Connaught Place (28.6315, 77.2167) and IIT Delhi (28.545, 77.1926) is ~10 km
    const dist = calculateHaversineDistanceKm(28.6315, 77.2167, 28.545, 77.1926);
    assert.ok(dist >= 9 && dist <= 12, `Expected ~10km, got ${dist}`);
  });

  await t.test("Flags observation older than 3 hours as stale", () => {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    assert.equal(isReadingStale(fourHoursAgo, 3), true);
    assert.equal(isReadingStale(tenMinutesAgo, 3), false);
  });
});

test("Campus Decision Engine Input Validation", async (t) => {
  await t.test("Rejects out-of-range coordinates", () => {
    const invalidLat = validateCampusDecisionInput({
      campusName: "Test Campus",
      coordinates: { lat: 105, lng: 77.2 },
      activityType: "sports",
      plannedDate: "2026-10-10",
      plannedStartTime: "09:00",
      plannedDurationMinutes: 60,
    });
    assert.equal(invalidLat.valid, false);
    assert.match(invalidLat.error!, /Latitude/);
  });

  await t.test("Rejects invalid duration", () => {
    const shortDuration = validateCampusDecisionInput({
      campusName: "Test Campus",
      coordinates: { lat: 28.5, lng: 77.2 },
      activityType: "sports",
      plannedDate: "2026-10-10",
      plannedStartTime: "09:00",
      plannedDurationMinutes: 5, // Minimum is 15
    });
    assert.equal(shortDuration.valid, false);
    assert.match(shortDuration.error!, /duration/);
  });

  await t.test("Rejects invalid time format", () => {
    const badTime = validateCampusDecisionInput({
      campusName: "Test Campus",
      coordinates: { lat: 28.5, lng: 77.2 },
      activityType: "sports",
      plannedDate: "2026-10-10",
      plannedStartTime: "25:99",
      plannedDurationMinutes: 60,
    });
    assert.equal(badTime.valid, false);
    assert.match(badTime.error!, /24-hour format/);
  });
});

test("Campus Decision Engine Slot Comparison & Reason Codes", async (t) => {
  const dummyForecast: HourlyForecastPoint[] = [
    { time: "2026-10-10T08:00:00Z", pm2_5: 95, pm10: 220, cpcbAqi: 220 },
    { time: "2026-10-10T09:00:00Z", pm2_5: 90, pm10: 210, cpcbAqi: 210 }, // 09:00 planned slot (Poor: AQI 210)
    { time: "2026-10-10T10:00:00Z", pm2_5: 85, pm10: 190, cpcbAqi: 190 },
    { time: "2026-10-10T15:00:00Z", pm2_5: 25, pm10: 45, cpcbAqi: 45 },  // 15:00 alternative slot (Good: AQI 45)
    { time: "2026-10-10T16:00:00Z", pm2_5: 28, pm10: 50, cpcbAqi: 50 },
  ];

  await t.test("Recommends alternative slot when alternative is noticeably cleaner", () => {
    const input: CampusDecisionInput = {
      campusName: "IIT Delhi",
      coordinates: { lat: 28.545, lng: 77.1926 },
      activityType: "sports",
      plannedDate: "2026-10-10",
      plannedStartTime: "09:00",
      plannedDurationMinutes: 60,
      alternativeStartTime: "15:00",
      currentObservation: {
        timestamp: new Date().toISOString(),
        pm2_5: 90,
        pm10: 210,
        stationName: "IIT Delhi Station",
        isPhysicalStation: true,
      },
      hourlyForecast: dummyForecast,
    };

    const decision = evaluateCampusDecision(input);
    assert.equal(decision.decisionCategory, "Consider an alternative time or location");
    assert.equal(decision.slotComparison.preferredSlot, "alternative");
    assert.ok(decision.reasonCodes.includes("ALTERNATIVE_SLOT_RELATIVELY_BETTER"));
    assert.ok(decision.reasonCodes.includes("PLANNED_SLOT_LESS_FAVORABLE"));
  });

  await t.test("Approves planned slot when conditions are favorable", () => {
    const cleanForecast: HourlyForecastPoint[] = [
      { time: "2026-10-10T09:00:00Z", pm2_5: 20, pm10: 40, cpcbAqi: 40 },
      { time: "2026-10-10T10:00:00Z", pm2_5: 22, pm10: 42, cpcbAqi: 42 },
    ];

    const input: CampusDecisionInput = {
      campusName: "IISc Bengaluru",
      coordinates: { lat: 13.0219, lng: 77.5671 },
      activityType: "outdoor_assembly",
      plannedDate: "2026-10-10",
      plannedStartTime: "09:00",
      plannedDurationMinutes: 60,
      currentObservation: {
        timestamp: new Date().toISOString(),
        pm2_5: 20,
        pm10: 40,
        stationName: "IISc CAAQMS Station",
        isPhysicalStation: true,
      },
      hourlyForecast: cleanForecast,
    };

    const decision = evaluateCampusDecision(input);
    assert.equal(decision.decisionCategory, "Conditions comparatively more favorable");
    assert.ok(decision.reasonCodes.includes("PLANNED_SLOT_FAVORABLE"));
  });

  await t.test("Flags OBSERVATION_STALE when telemetry is outdated", () => {
    const input: CampusDecisionInput = {
      campusName: "Delhi University",
      coordinates: { lat: 28.7041, lng: 77.1025 },
      activityType: "walking",
      plannedDate: "2026-10-10",
      plannedStartTime: "09:00",
      plannedDurationMinutes: 60,
      currentObservation: {
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        pm2_5: 45,
        pm10: 80,
      },
      hourlyForecast: dummyForecast,
    };

    const decision = evaluateCampusDecision(input);
    assert.ok(decision.reasonCodes.includes("OBSERVATION_STALE"));
  });

  await t.test("Handles missing forecast gracefully with FORECAST_UNAVAILABLE", () => {
    const input: CampusDecisionInput = {
      campusName: "BITS Pilani",
      coordinates: { lat: 28.3639, lng: 75.587 },
      activityType: "outdoor_events",
      plannedDate: "2026-10-10",
      plannedStartTime: "10:00",
      plannedDurationMinutes: 120,
      currentObservation: {
        timestamp: new Date().toISOString(),
        pm2_5: 35,
        pm10: 70,
      },
      hourlyForecast: [], // Empty forecast
    };

    const decision = evaluateCampusDecision(input);
    assert.ok(decision.reasonCodes.includes("FORECAST_UNAVAILABLE"));
  });
});

test("Deterministic Bedrock Fallback Generator", async (t) => {
  await t.test("Produces structured, grounded explanation without throwing", () => {
    const dummyDecision = evaluateCampusDecision({
      campusName: "IIT Delhi",
      coordinates: { lat: 28.545, lng: 77.1926 },
      activityType: "sports",
      plannedDate: "2026-10-10",
      plannedStartTime: "09:00",
      plannedDurationMinutes: 60,
      currentObservation: {
        timestamp: new Date().toISOString(),
        pm2_5: 120,
        pm10: 250,
      },
    });

    const fallback = generateDeterministicFallbackExplanation(dummyDecision, "Can we hold football practice?");
    assert.ok(fallback.includes("Executive Summary"));
    assert.ok(fallback.includes("Time Slot Analysis"));
    assert.ok(fallback.includes("Operational Campus Actions"));
    assert.ok(fallback.includes("Data Attribution & Caveats"));
  });
});
