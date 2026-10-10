"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Calendar,
  Clock,
  Activity,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  MapPin,
  Wind,
  Layers,
  ArrowRight,
  Info,
  ChevronDown,
  HelpCircle,
  Send,
  Sliders,
  Check,
  Radio,
  FileText,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Preset Indian Universities
interface CampusPreset {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  defaultStation: string;
}

const PRESET_CAMPUSES: CampusPreset[] = [
  {
    id: "iit-delhi",
    name: "IIT Delhi (Hauz Khas)",
    city: "New Delhi, Delhi",
    lat: 28.545,
    lng: 77.1926,
    defaultStation: "IIT Delhi CAAQMS Monitoring Station",
  },
  {
    id: "du-north",
    name: "Delhi University (North Campus)",
    city: "Delhi, Delhi",
    lat: 28.6904,
    lng: 77.2074,
    defaultStation: "CPCB Station - Punjabi Bagh, Delhi",
  },
  {
    id: "bits-pilani",
    name: "BITS Pilani Main Campus",
    city: "Pilani, Rajasthan",
    lat: 28.3639,
    lng: 75.587,
    defaultStation: "Atmospheric Grid Point (28.364°N, 75.587°E)",
  },
  {
    id: "iit-bombay",
    name: "IIT Bombay (Powai)",
    city: "Mumbai, Maharashtra",
    lat: 19.1334,
    lng: 72.9133,
    defaultStation: "IIT Bombay Powai Monitoring Station",
  },
  {
    id: "iisc-bangalore",
    name: "Indian Institute of Science (IISc)",
    city: "Bengaluru, Karnataka",
    lat: 13.0219,
    lng: 77.5671,
    defaultStation: "IISc Bengaluru CAAQMS Station",
  },
];

type ActivityType = "outdoor_assembly" | "sports" | "walking" | "outdoor_events";

const ACTIVITY_OPTIONS: { id: ActivityType; name: string; exertion: string; desc: string }[] = [
  {
    id: "outdoor_assembly",
    name: "Outdoor Assembly & Gatherings",
    exertion: "Low Exertion",
    desc: "Seated morning assemblies, academic convocations, and award ceremonies.",
  },
  {
    id: "sports",
    name: "Sports, Athletics & PE",
    exertion: "High Exertion",
    desc: "Cardiovascular training, football, track and field, and competitive games.",
  },
  {
    id: "walking",
    name: "Campus Commute & Walking",
    exertion: "Moderate Exertion",
    desc: "Inter-hostel transit, student pedestrian corridors, and campus tours.",
  },
  {
    id: "outdoor_events",
    name: "Festivals & Outdoor Events",
    exertion: "Moderate Exertion",
    desc: "Club booths, cultural fests, open mic stages, and food festivals.",
  },
];

export default function CampusDecisionPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  // Selected campus & Custom coordinates state
  const [selectedCampus, setSelectedCampus] = useState<CampusPreset>(PRESET_CAMPUSES[0]);
  const [isCustomCampus, setIsCustomCampus] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");
  const [campusDropdownOpen, setCampusDropdownOpen] = useState(false);

  // Activity & Schedule state
  const [activityType, setActivityType] = useState<ActivityType>("sports");
  const [plannedDate, setPlannedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [plannedStartTime, setPlannedStartTime] = useState("09:00");
  const [plannedDuration, setPlannedDuration] = useState(60);
  const [compareAlternative, setCompareAlternative] = useState(true);
  const [altStartTime, setAltStartTime] = useState("16:00");

  // Data fetching states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [decisionResult, setDecisionResult] = useState<any>(null);
  const [zonesData, setZonesData] = useState<any>(null);

  // AI Explanation state
  const [explaining, setExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [qnaLoading, setQnaLoading] = useState(false);

  // Active coordinates
  const currentCoords = isCustomCampus
    ? { lat: parseFloat(customLat) || 28.545, lng: parseFloat(customLng) || 77.1926 }
    : { lat: selectedCampus.lat, lng: selectedCampus.lng };

  const currentCampusName = isCustomCampus ? customName || "Custom Campus" : selectedCampus.name;

  // Fetch telemetry, decision, and zones
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch live air-quality
      const aqRes = await fetch(
        `${apiUrl}/api/campus/air-quality?lat=${currentCoords.lat}&lng=${currentCoords.lng}&name=${encodeURIComponent(
          currentCampusName
        )}`
      );
      if (!aqRes.ok) throw new Error("Could not retrieve upstream air quality telemetry.");
      const aqJson = await aqRes.json();
      setTelemetryData(aqJson.data);

      // 2. Fetch deterministic decision
      const decisionRes = await fetch(`${apiUrl}/api/campus/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campusName: currentCampusName,
          coordinates: currentCoords,
          activityType,
          plannedDate,
          plannedStartTime,
          plannedDurationMinutes: plannedDuration,
          alternativeStartTime: compareAlternative ? altStartTime : undefined,
        }),
      });
      if (!decisionRes.ok) throw new Error("Decision engine evaluation failed.");
      const decisionJson = await decisionRes.json();
      setDecisionResult(decisionJson.data);

      // 3. Fetch campus zones
      const zonesRes = await fetch(`${apiUrl}/api/campus/zones?lat=${currentCoords.lat}&lng=${currentCoords.lng}`);
      if (zonesRes.ok) {
        const zonesJson = await zonesRes.json();
        setZonesData(zonesJson.data);
      }

      // Auto trigger AI explanation
      triggerAiExplanation(decisionJson.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to communicate with BreatheWise decision engine.");
    } finally {
      setLoading(false);
    }
  }, [
    apiUrl,
    currentCoords.lat,
    currentCoords.lng,
    currentCampusName,
    activityType,
    plannedDate,
    plannedStartTime,
    plannedDuration,
    compareAlternative,
    altStartTime,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // AI Explanation call
  async function triggerAiExplanation(decision: any, question?: string) {
    if (!decision) return;
    setExplaining(true);
    try {
      const res = await fetch(`${apiUrl}/api/campus/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionResult: decision,
          userQuestion: question,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiExplanation(json.data);
      }
    } catch (e) {
      console.warn("AI explanation fetch issue:", e);
    } finally {
      setExplaining(false);
      setQnaLoading(false);
    }
  }

  function handleCustomCampusApply() {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert("Please enter valid decimal coordinates (Lat: -90 to 90, Lng: -180 to 180)");
      return;
    }
    setIsCustomCampus(true);
    setCampusDropdownOpen(false);
    fetchData();
  }

  function handleAskQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!userQuestion.trim() || !decisionResult) return;
    setQnaLoading(true);
    triggerAiExplanation(decisionResult, userQuestion);
    setUserQuestion("");
  }

  // Visual category styling helper
  const categoryBadgeStyle = (category?: string) => {
    switch (category) {
      case "Good":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Satisfactory":
        return "bg-green-100 text-green-800 border-green-300";
      case "Moderate":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Poor":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Very Poor":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "Severe":
        return "bg-red-200 text-red-900 border-red-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const decisionTheme = (cat?: string) => {
    switch (cat) {
      case "Conditions comparatively more favorable":
        return {
          banner: "bg-emerald-50 border-emerald-200 text-emerald-900",
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          pill: "bg-emerald-600 text-white",
        };
      case "Consider an alternative time or location":
        return {
          banner: "bg-amber-50 border-amber-200 text-amber-900",
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          pill: "bg-amber-600 text-white",
        };
      case "Follow applicable official guidance and review conditions":
        return {
          banner: "bg-rose-50 border-rose-200 text-rose-900",
          icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
          pill: "bg-rose-600 text-white",
        };
      default:
        return {
          banner: "bg-gray-50 border-gray-200 text-gray-900",
          icon: <HelpCircle className="w-6 h-6 text-gray-600" />,
          pill: "bg-gray-600 text-white",
        };
    }
  };

  const theme = decisionTheme(decisionResult?.decisionCategory);
  const obs = telemetryData?.observation;
  const isStale = obs?.isStale;

  return (
    <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-8 max-w-screen-2xl mx-auto">
      {/* 1. Header & Campus Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-950 tracking-tight">
              Campus Decision System
            </h1>
            <Badge variant="outline" className="text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">
              India NAQI / CPCB Standard
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Deterministic air-quality evaluation & schedule optimization for collegiate outdoor activities.
          </p>
        </div>

        {/* Campus Dropdown & Custom Coords Picker */}
        <div className="relative">
          <button
            onClick={() => setCampusDropdownOpen(!campusDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Campus</p>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-[280px]">
                {currentCampusName}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
          </button>

          {campusDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-gray-200 shadow-2xl p-3 z-50 animate-in fade-in-50 zoom-in-95">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                Select Collegiate Campus
              </p>
              <div className="flex flex-col gap-1 mt-1 max-h-56 overflow-y-auto">
                {PRESET_CAMPUSES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCampus(c);
                      setIsCustomCampus(false);
                      setCampusDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between cursor-pointer",
                      !isCustomCampus && selectedCampus.id === c.id
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    <div>
                      <p className="font-medium text-gray-900 leading-tight">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.city}</p>
                    </div>
                    {!isCustomCampus && selectedCampus.id === c.id && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>

              <Separator className="my-2" />

              {/* Custom Coordinates Section */}
              <div className="p-2 bg-gray-50 rounded-xl flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Custom Coordinates / Campus
                </p>
                <Input
                  placeholder="Campus Name (e.g. Ashoka University)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Latitude (e.g. 28.98)"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="h-8 text-xs bg-white font-mono"
                  />
                  <Input
                    placeholder="Longitude (e.g. 77.10)"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="w-full text-xs h-8 bg-blue-600 hover:bg-blue-700 font-medium"
                  onClick={handleCustomCampusApply}
                >
                  Apply Custom Location
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stale Data or Error Warning Banner */}
      {isStale && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <span className="font-bold">Data Freshness Alert: </span>
            Ground station observation is over 3 hours old ({telemetryData?.observation?.timestamp}). Recent microclimate
            shifts may not be represented. Time slot comparisons use hourly numerical forecasts.
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-red-900">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} className="text-xs">
            Retry Connection
          </Button>
        </div>
      )}

      {/* 2. Main Grid: Setup Form + Telemetry Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="border-gray-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-gray-900">
                  <Sliders className="w-4 h-4 text-blue-600" /> Activity & Schedule Configuration
                </span>
                <span className="text-[11px] font-normal text-gray-400">Validated Parameters</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Select your intended campus event and specify timing to compare exposure windows.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Activity Selector */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Activity Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setActivityType(opt.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1",
                        activityType === opt.id
                          ? "border-blue-500 bg-blue-50/70 shadow-xs"
                          : "border-gray-200 bg-white hover:bg-gray-50/80"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{opt.name}</span>
                        {activityType === opt.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wide">
                        {opt.exertion}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Start Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> Planned Date
                  </label>
                  <Input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="text-xs h-9 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" /> Start Time (24h)
                  </label>
                  <Input
                    type="time"
                    value={plannedStartTime}
                    onChange={(e) => setPlannedStartTime(e.target.value)}
                    className="text-xs h-9 bg-white"
                  />
                </div>
              </div>

              {/* Duration Slider / Buttons */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">Planned Duration</span>
                  <span className="font-mono font-bold text-blue-700">{plannedDuration} Minutes</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setPlannedDuration(dur)}
                      className={cn(
                        "py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                        plannedDuration === dur
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Alternative Time Slot Toggle & Picker */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Compare Alternative Window</p>
                      <p className="text-[11px] text-gray-500">Forecast comparison for schedule optimization</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={compareAlternative}
                    onChange={(e) => setCompareAlternative(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {compareAlternative && (
                  <div className="pt-2 border-t border-gray-200 flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600">Alternative Start Time:</span>
                    <Input
                      type="time"
                      value={altStartTime}
                      onChange={(e) => setAltStartTime(e.target.value)}
                      className="text-xs h-8 w-32 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Evaluate Button */}
              <Button
                onClick={fetchData}
                disabled={loading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                {loading ? "Evaluating Atmospheric Conditions..." : "Re-evaluate Schedule Decision"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Telemetry Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Observation Telemetry Card */}
          <Card className="border-gray-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Observed Ambient Air Telemetry
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-gray-700 text-gray-200">
                    Direct Measurement
                  </Badge>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {obs?.timestamp ? new Date(obs.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live"}
                </span>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl md:text-5xl font-black font-mono tracking-tight">
                      {obs?.cpcbAqi ?? "--"}
                    </span>
                    <span className="text-sm font-semibold text-gray-300">CPCB NAQI</span>
                    <Badge className={cn("text-xs font-bold border px-2.5 py-0.5", categoryBadgeStyle(obs?.category))}>
                      {obs?.category ?? "Loading"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 max-w-md">
                    {obs?.categoryDescription ?? "Evaluating atmospheric particulate load against Indian standards..."}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Prominent Pollutant</p>
                  <p className="text-lg font-bold text-amber-400 font-mono">
                    {obs?.prominentPollutant ?? "PM2.5"}
                  </p>
                </div>
              </div>
            </div>

            {/* Pollutant Sub-Indices Grid */}
            <CardContent className="p-4 bg-white">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Monitored Pollutants (CPCB Sub-Index Breakdown)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {obs?.subIndices ? (
                  Object.entries(obs.subIndices).map(([key, data]: [string, any]) => (
                    <div key={key} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 flex flex-col">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">{data.pollutant}</span>
                      <span className="text-sm font-extrabold font-mono text-gray-900 mt-0.5">
                        {data.concentration} <span className="text-[10px] font-normal text-gray-500">{data.unit}</span>
                      </span>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-gray-400">Idx: {data.subIndex}</span>
                        <span className="font-semibold text-gray-700">{data.category}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 col-span-6">Loading pollutant matrix...</p>
                )}
              </div>

              {/* Station Attribution & Haversine Distance */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Station: <strong className="text-gray-800">{telemetryData?.monitoringStation?.name}</strong>
                  </span>
                  {telemetryData?.monitoringStation?.distanceKm !== null && (
                    <Badge variant="outline" className="text-[10px] ml-1 bg-gray-50">
                      {telemetryData?.monitoringStation?.distanceKm} km from campus
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span>Source: {telemetryData?.monitoringStation?.source}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Decision Card & Evidence */}
          {decisionResult && (
            <Card className={cn("border shadow-sm rounded-2xl overflow-hidden transition-all", theme.banner)}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {theme.icon}
                    <div>
                      <p className="text-xs uppercase font-bold tracking-wider opacity-75">
                        Deterministic Decision Result
                      </p>
                      <h2 className="text-lg font-bold leading-tight">{decisionResult.decisionCategory}</h2>
                    </div>
                  </div>
                  <Badge className={cn("text-xs font-bold px-3 py-1 shadow-xs", theme.pill)}>
                    {decisionResult.activity?.displayName}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 text-sm">
                <div className="p-3.5 bg-white/90 rounded-xl border border-black/5 shadow-xs">
                  <p className="font-bold text-gray-950 mb-1">Recommended Operational Action:</p>
                  <p className="text-gray-800 leading-relaxed">{decisionResult.primaryRecommendation}</p>
                </div>

                {/* Reason Codes & Justification */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-2">
                    Evidence & Machine-Readable Reason Codes:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {decisionResult.reasonCodes.map((code: string) => (
                      <Badge
                        key={code}
                        variant="secondary"
                        className="font-mono text-[10px] font-bold bg-white text-gray-800 border border-gray-200"
                      >
                        {code}
                      </Badge>
                    ))}
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
                    {decisionResult.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                {/* Limitations & Next Review */}
                <div className="pt-3 border-t border-black/10 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
                  <div>
                    <span className="font-semibold">Next Protocol Review: </span>
                    <span>
                      {new Date(decisionResult.nextReviewTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-75 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Non-medical administrative support model</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 4. Time Slot Comparison (Side-by-Side Cards) */}
      {decisionResult?.slotComparison?.plannedSlot && (
        <Card className="border-gray-200 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                  <Clock className="w-4 h-4 text-blue-600" /> Time Slot Comparison & Forecast Progression
                </CardTitle>
                <CardDescription className="text-xs">
                  Side-by-side evaluation of scheduled window versus alternative time using Open-Meteo hourly forecasts.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                Hourly Forecast Model (Separated from Observations)
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Planned Slot Card */}
              {decisionResult.slotComparison.plannedSlot && (
                <div
                  className={cn(
                    "p-4 rounded-xl border flex flex-col gap-3 relative transition-all",
                    decisionResult.slotComparison.preferredSlot === "planned"
                      ? "border-emerald-400 bg-emerald-50/40 shadow-xs"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Planned Activity Window
                      </span>
                      <h3 className="text-base font-extrabold text-gray-900">
                        {decisionResult.slotComparison.plannedSlot.startTime} –{" "}
                        {decisionResult.slotComparison.plannedSlot.endTime}
                      </h3>
                    </div>
                    {decisionResult.slotComparison.preferredSlot === "planned" && (
                      <Badge className="bg-emerald-600 text-white text-[11px]">Recommended Slot</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Forecast AQI</p>
                      <p className="text-xl font-black font-mono text-gray-900">
                        {decisionResult.slotComparison.plannedSlot.averageAqi}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Peak PM2.5</p>
                      <p className="text-xl font-black font-mono text-gray-900">
                        {decisionResult.slotComparison.plannedSlot.peakPm25}{" "}
                        <span className="text-[10px] font-normal text-gray-400">µg/m³</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Risk Bracket</p>
                      <Badge
                        className={cn(
                          "text-[10px] font-bold mt-1",
                          categoryBadgeStyle(decisionResult.slotComparison.plannedSlot.category)
                        )}
                      >
                        {decisionResult.slotComparison.plannedSlot.category}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600">
                    Sampled across {decisionResult.slotComparison.plannedSlot.dataPointsCount} hourly atmospheric grid points.
                  </p>
                </div>
              )}

              {/* Alternative Slot Card */}
              {decisionResult.slotComparison.alternativeSlot ? (
                <div
                  className={cn(
                    "p-4 rounded-xl border flex flex-col gap-3 relative transition-all",
                    decisionResult.slotComparison.preferredSlot === "alternative"
                      ? "border-emerald-500 bg-emerald-50/50 shadow-xs"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Alternative Activity Window
                      </span>
                      <h3 className="text-base font-extrabold text-gray-900">
                        {decisionResult.slotComparison.alternativeSlot.startTime} –{" "}
                        {decisionResult.slotComparison.alternativeSlot.endTime}
                      </h3>
                    </div>
                    {decisionResult.slotComparison.preferredSlot === "alternative" && (
                      <Badge className="bg-emerald-600 text-white text-[11px]">Preferred Window</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Forecast AQI</p>
                      <p className="text-xl font-black font-mono text-gray-900">
                        {decisionResult.slotComparison.alternativeSlot.averageAqi}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Peak PM2.5</p>
                      <p className="text-xl font-black font-mono text-gray-900">
                        {decisionResult.slotComparison.alternativeSlot.peakPm25}{" "}
                        <span className="text-[10px] font-normal text-gray-400">µg/m³</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Risk Bracket</p>
                      <Badge
                        className={cn(
                          "text-[10px] font-bold mt-1",
                          categoryBadgeStyle(decisionResult.slotComparison.alternativeSlot.category)
                        )}
                      >
                        {decisionResult.slotComparison.alternativeSlot.category}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600">
                    {decisionResult.slotComparison.comparisonSummary}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center">
                  <Compass className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs font-semibold text-gray-700">No Alternative Window Selected</p>
                  <p className="text-[11px] text-gray-400 max-w-xs mt-0.5">
                    Enable the alternative slot checkbox in the configuration panel to compare two time slots side by side.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Campus Zones & Monitoring Comparison */}
      {zonesData?.zones && (
        <Card className="border-gray-200 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                  <Layers className="w-4 h-4 text-blue-600" /> Campus Zone Telemetry & Sensor Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Spatial comparison across campus facilities. Directly measured station values are explicitly separated
                  from spatial estimates.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                Single CAAQMS Station Coverage Notice
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {zonesData.zones.map((zone: any) => (
                <div key={zone.zoneId} className="p-3.5 rounded-xl border border-gray-200 bg-white flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">{zone.zoneName}</p>
                      <p className="text-[10px] text-gray-400">{zone.zoneType}</p>
                    </div>
                    <Badge className={cn("text-[10px] font-bold", categoryBadgeStyle(zone.category))}>
                      {zone.cpcbAqi}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 font-mono py-1 border-t border-gray-100">
                    <span>PM2.5: {zone.pm25} µg/m³</span>
                    <span className="text-[11px] text-gray-400 font-sans">{zone.distanceKm} km</span>
                  </div>

                  <div className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg leading-relaxed">
                    <span className="font-semibold block text-gray-700">{zone.dataType}</span>
                    {zone.recommendation}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-400 mt-3 italic text-center">
              * Notice: {zonesData.attributionNotice}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 6. Grounded AWS Bedrock / Fallback AI Explanation Layer */}
      <Card className="border-gray-200 shadow-sm rounded-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base text-gray-900">
                  Grounded Air Intelligence Explanation Layer
                </CardTitle>
                <CardDescription className="text-xs">
                  Strictly constrained AI advice grounded in live CPCB telemetry and deterministic engine decisions.
                </CardDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(
                "text-xs font-semibold",
                aiExplanation?.isAiGenerated
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}
            >
              {aiExplanation?.isAiGenerated ? "AWS Bedrock Claude (Active)" : "Deterministic Rule Engine Fallback"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {explaining ? (
            <div className="p-6 rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold text-gray-700">Synthesizing evidence-based campus guidance...</p>
            </div>
          ) : aiExplanation ? (
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs prose prose-sm max-w-none text-xs text-gray-800 leading-relaxed space-y-3">
              <div className="whitespace-pre-line font-sans">{aiExplanation.explanation}</div>

              {aiExplanation.usedFallbackReason && (
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-500">
                  <span className="font-semibold text-gray-700">Fallback Notice: </span>
                  {aiExplanation.usedFallbackReason}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Awaiting decision execution...</p>
          )}

          {/* Ask AI a Campus-Specific Question */}
          <form onSubmit={handleAskQuestion} className="flex gap-2">
            <Input
              placeholder="Ask a campus activity question (e.g., 'Should asthmatic students wear N95 during transit?')"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              className="text-xs h-9 bg-white"
            />
            <Button
              type="submit"
              disabled={qnaLoading || !userQuestion.trim()}
              className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {qnaLoading ? "Querying..." : "Ask Advisor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
