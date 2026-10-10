"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Send,
  Sliders,
  Check,
  Compass,
  Gauge,
  BarChart3,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Preset Indian Collegiate Campuses
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
    defaultStation: "Atmospheric Grid Point (Pilani)",
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
type ActiveTabType = "telemetry" | "comparison" | "advisor";

const ACTIVITY_OPTIONS: { id: ActivityType; name: string; exertion: string; desc: string; icon: string }[] = [
  {
    id: "sports",
    name: "Sports, Athletics & PE",
    exertion: "High Exertion",
    desc: "Cardiovascular training, football, track, and competitive sports.",
    icon: "⚽",
  },
  {
    id: "outdoor_assembly",
    name: "Outdoor Assembly & Convocations",
    exertion: "Low Exertion",
    desc: "Seated morning assemblies, academic convocations, and award ceremonies.",
    icon: "🎓",
  },
  {
    id: "walking",
    name: "Campus Transit & Walking",
    exertion: "Moderate Exertion",
    desc: "Inter-hostel transit, student pedestrian corridors, and campus tours.",
    icon: "🚶",
  },
  {
    id: "outdoor_events",
    name: "Festivals & Outdoor Events",
    exertion: "Moderate Exertion",
    desc: "Club booths, cultural fests, open mic stages, and food stalls.",
    icon: "🎪",
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

  // Activity & Schedule state (SAFE PRERENDER INITIALIZATION)
  const [activityType, setActivityType] = useState<ActivityType>("sports");
  const [plannedDate, setPlannedDate] = useState("2026-10-10");
  const [plannedStartTime, setPlannedStartTime] = useState("09:00");
  const [plannedDuration, setPlannedDuration] = useState(60);
  const [compareAlternative, setCompareAlternative] = useState(true);
  const [altStartTime, setAltStartTime] = useState("16:00");

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<ActiveTabType>("telemetry");

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

  // Sync date on client-side mount safely without triggering prerender bailout
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPlannedDate(new Date().toISOString().split("T")[0]);
    }
  }, []);

  // Active coordinates
  const currentCoords = isCustomCampus
    ? { lat: parseFloat(customLat) || 28.545, lng: parseFloat(customLng) || 77.1926 }
    : { lat: selectedCampus.lat, lng: selectedCampus.lng };

  const currentCampusName = isCustomCampus ? customName || "Custom Campus" : selectedCampus.name;

  // AI Explanation call
  const triggerAiExplanation = useCallback(async (decision: any, question?: string) => {
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
  }, [apiUrl]);

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
    triggerAiExplanation,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle custom coordinates validation
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
          banner: "bg-emerald-500 text-white",
          lightBanner: "bg-emerald-50 border-emerald-200 text-emerald-950",
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          pill: "bg-emerald-600 text-white",
          statusTitle: "Favorable Outdoor Conditions",
        };
      case "Consider an alternative time or location":
        return {
          banner: "bg-amber-500 text-white",
          lightBanner: "bg-amber-50 border-amber-200 text-amber-950",
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          pill: "bg-amber-600 text-white",
          statusTitle: "Caution: Alternative Window Recommended",
        };
      case "Follow applicable official guidance and review conditions":
      default:
        return {
          banner: "bg-rose-600 text-white",
          lightBanner: "bg-rose-50 border-rose-200 text-rose-950",
          icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
          pill: "bg-rose-600 text-white",
          statusTitle: "Restricted Protocol: Action Required",
        };
    }
  };

  const theme = decisionTheme(decisionResult?.decisionCategory);
  const obs = telemetryData?.observation;
  const isStale = obs?.isStale;

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] px-3 md:px-6 py-4 flex flex-col gap-4 max-w-[1700px] mx-auto animate-fade-up">

      {/* Top Institutional Status & Campus Command Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/85 backdrop-blur-md p-3.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                Institutional Campus Safety Cockpit
              </h1>
              <Badge variant="outline" className="text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200 hidden sm:inline-flex">
                CPCB NAQI / GRAP Protocol
              </Badge>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Deterministic outdoor activity safety evaluation for universities and schools.
            </p>
          </div>
        </div>

        {/* Quick Campus Pill Switcher & Dropdown */}
        <div className="flex items-center gap-2">
          {/* Quick Preset Pills for Top Universities */}
          <div className="hidden xl:flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs">
            {PRESET_CAMPUSES.slice(0, 3).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCampus(c);
                  setIsCustomCampus(false);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer",
                  !isCustomCampus && selectedCampus.id === c.id
                    ? "bg-white text-gray-900 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {c.name.split("(")[0].trim()}
              </button>
            ))}
          </div>

          {/* Campus Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setCampusDropdownOpen(!campusDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-gray-300 transition-all cursor-pointer text-xs font-semibold text-gray-800"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate max-w-[160px] sm:max-w-[200px]">{currentCampusName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {campusDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-gray-200 shadow-2xl p-3 z-50 animate-in fade-in-50 zoom-in-95">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                  Select Collegiate Institution
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
                        "w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer",
                        !isCustomCampus && selectedCampus.id === c.id
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <div>
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="text-[10px] text-gray-400">{c.city}</p>
                      </div>
                      {!isCustomCampus && selectedCampus.id === c.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-gray-100 my-2" />

                {/* Custom Coordinates Section */}
                <div className="p-2.5 bg-gray-50 rounded-xl flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Custom Campus / Coordinates
                  </p>
                  <Input
                    placeholder="Campus Name (e.g. Ashoka University)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Latitude (e.g. 28.54)"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="h-8 text-xs bg-white font-mono"
                    />
                    <Input
                      placeholder="Longitude (e.g. 77.19)"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full text-xs h-8 gradient-primary text-white font-medium cursor-pointer"
                    onClick={handleCustomCampusApply}
                  >
                    Set Location
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Freshness / Error Alerts */}
      {isStale && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-900 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Data Freshness Notice: </strong> Observation timestamp is over 3 hours old ({obs?.timestamp}). Hourly comparisons utilize numerical forecast grids.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-xs text-red-900 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} className="text-xs h-7">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Main 2-Column Split Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">

        {/* Left Column: Activity & Schedule Configuration Drawer (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3.5">
          <Card className="border-gray-200/80 shadow-xs rounded-2xl bg-white">
            <CardHeader className="pb-2.5">
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" /> Event & Activity Setup
                </span>
                <span className="text-[10px] text-gray-400 font-mono">CPCB Matrix</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Configure timing to evaluate atmospheric health risk before executing campus activities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">

              {/* Activity Selector */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Campus Activity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setActivityType(opt.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1",
                        activityType === opt.id
                          ? "border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-200"
                          : "border-gray-200 bg-gray-50/60 hover:bg-gray-100"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{opt.icon}</span>
                        {activityType === opt.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">{opt.name}</p>
                      <span className="text-[9px] font-semibold text-blue-700 uppercase tracking-wide">
                        {opt.exertion}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Start Time */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3 text-gray-400" /> Date
                  </label>
                  <Input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="text-xs h-9 bg-gray-50/80 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-gray-400" /> Start Time (24h)
                  </label>
                  <Input
                    type="time"
                    value={plannedStartTime}
                    onChange={(e) => setPlannedStartTime(e.target.value)}
                    className="text-xs h-9 bg-gray-50/80 rounded-xl"
                  />
                </div>
              </div>

              {/* Duration Pills */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Duration</span>
                  <span className="font-mono font-bold text-blue-700 text-xs">{plannedDuration} Minutes</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[30, 60, 90, 120].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setPlannedDuration(dur)}
                      className={cn(
                        "py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                        plannedDuration === dur
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Alternative Time Window Box */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Compare Alternative Window</p>
                      <p className="text-[10px] text-gray-500">Hourly forecast optimization</p>
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
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-600">Alternative Time:</span>
                    <Input
                      type="time"
                      value={altStartTime}
                      onChange={(e) => setAltStartTime(e.target.value)}
                      className="text-xs h-8 w-28 bg-white rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Evaluate Button */}
              <Button
                onClick={fetchData}
                disabled={loading}
                className="w-full h-10 gradient-primary text-white font-bold text-xs shadow-xs gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                {loading ? "Evaluating Atmospheric Risk..." : "Run Institutional Protocol Check"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Institutional Decision & Telemetry Deck (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3.5">

          {/* Hero Institutional Decision Protocol Spotlight Banner */}
          {decisionResult && (
            <div className={cn("p-4 rounded-2xl border shadow-xs transition-all", theme.lightBanner)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs border flex items-center justify-center shrink-0">
                    {theme.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Operational Safety Verdict
                      </span>
                      <Badge className={cn("text-[10px] font-bold shadow-xs", theme.pill)}>
                        {decisionResult.activity?.displayName}
                      </Badge>
                    </div>
                    <h2 className="text-base font-extrabold text-gray-950 mt-0.5">
                      {theme.statusTitle}
                    </h2>
                    <p className="text-xs text-gray-800 mt-1 leading-relaxed font-medium">
                      {decisionResult.primaryRecommendation}
                    </p>
                  </div>
                </div>

                {/* Reason Codes & Countdown */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex flex-wrap gap-1">
                    {decisionResult.reasonCodes?.map((code: string) => (
                      <Badge
                        key={code}
                        variant="secondary"
                        className="font-mono text-[9px] font-bold bg-white text-gray-800 border border-gray-200"
                      >
                        {code}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Next Protocol Review: {new Date(decisionResult.nextReviewTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab("telemetry")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "telemetry"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Gauge className="w-3.5 h-3.5" />
                Live Telemetry & Zones
              </button>
              <button
                onClick={() => setActiveTab("comparison")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "comparison"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                Time Slot Forecast
              </button>
              <button
                onClick={() => setActiveTab("advisor")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "advisor"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Grounded AI Advisor
              </button>
            </div>

            <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">
              Station: {telemetryData?.monitoringStation?.name ? telemetryData.monitoringStation.name.split(" ")[0] : "CAAQMS"}
            </span>
          </div>

          {/* TAB 1: Live Ambient Telemetry & Micro-Zones */}
          {activeTab === "telemetry" && (
            <div className="flex flex-col gap-3.5 animate-in fade-in-50 duration-200">
              {/* Telemetry Overview Card */}
              <Card className="border-gray-200/80 shadow-xs rounded-2xl bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                        Live Campus Atmospheric Observation
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {obs?.timestamp ? new Date(obs.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black font-mono tracking-tight">
                          {obs?.cpcbAqi ?? "--"}
                        </span>
                        <span className="text-xs font-semibold text-gray-300">CPCB NAQI</span>
                        <Badge className={cn("text-xs font-bold border px-2.5 py-0.5", categoryBadgeStyle(obs?.category))}>
                          {obs?.category ?? "Loading"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 max-w-lg leading-relaxed">
                        {obs?.categoryDescription ?? "Analyzing atmospheric particulate load against Indian National standards..."}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Prominent Pollutant</span>
                      <p className="text-base font-extrabold text-amber-400 font-mono">
                        {obs?.prominentPollutant ?? "PM2.5"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-Indices Breakdown */}
                <CardContent className="p-4 bg-white">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    CPCB Multi-Pollutant Fingerprint
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {obs?.subIndices ? (
                      Object.entries(obs.subIndices).map(([key, data]: [string, any]) => (
                        <div key={key} className="p-2 rounded-xl border border-gray-100 bg-gray-50/70 flex flex-col">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{data.pollutant}</span>
                          <span className="text-xs font-extrabold font-mono text-gray-900 mt-0.5">
                            {data.concentration} <span className="text-[9px] font-normal text-gray-400">{data.unit}</span>
                          </span>
                          <div className="mt-1 flex items-center justify-between text-[9px]">
                            <span className="text-gray-400">Idx: {data.subIndex}</span>
                            <span className="font-semibold text-gray-700">{data.category}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 col-span-6">Loading pollutant matrix...</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Campus Micro-Zones */}
              {zonesData?.zones && (
                <Card className="border-gray-200/80 shadow-xs rounded-2xl bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" /> Campus Micro-Zone Sensor Mapping
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Spatial sensor distribution across campus grounds and academic blocks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {zonesData.zones.map((zone: any) => (
                        <div key={zone.zoneId} className="p-3 rounded-xl border border-gray-200/90 bg-white flex flex-col gap-1.5 shadow-2xs">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <p className="text-xs font-bold text-gray-900 leading-tight">{zone.zoneName}</p>
                              <p className="text-[10px] text-gray-400">{zone.zoneType}</p>
                            </div>
                            <Badge className={cn("text-[10px] font-bold", categoryBadgeStyle(zone.category))}>
                              {zone.cpcbAqi}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-600 font-mono py-0.5 border-t border-gray-100">
                            <span>PM2.5: {zone.pm25} µg/m³</span>
                            <span className="text-[10px] text-gray-400 font-sans">{zone.distanceKm} km</span>
                          </div>

                          <div className="text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-lg leading-relaxed">
                            <span className="font-semibold block text-gray-700">{zone.dataType}</span>
                            {zone.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB 2: Time Slot Forecast Comparison */}
          {activeTab === "comparison" && (
            <div className="flex flex-col gap-3.5 animate-in fade-in-50 duration-200">
              <Card className="border-gray-200/80 shadow-xs rounded-2xl bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> Time Slot Comparison & Forecast Progression
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Side-by-side numerical forecast evaluation to optimize collegiate activity timing.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      Hourly Grid Model
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Planned Slot */}
                    {decisionResult?.slotComparison?.plannedSlot && (
                      <div
                        className={cn(
                          "p-4 rounded-xl border flex flex-col gap-2.5 relative transition-all",
                          decisionResult.slotComparison.preferredSlot === "planned"
                            ? "border-emerald-400 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-200"
                            : "border-gray-200 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Scheduled Window
                            </span>
                            <h3 className="text-base font-extrabold text-gray-900">
                              {decisionResult.slotComparison.plannedSlot.startTime} – {decisionResult.slotComparison.plannedSlot.endTime}
                            </h3>
                          </div>
                          {decisionResult.slotComparison.preferredSlot === "planned" && (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Recommended Window</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-center">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Forecast AQI</span>
                            <p className="text-lg font-black font-mono text-gray-900">
                              {decisionResult.slotComparison.plannedSlot.averageAqi}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Peak PM2.5</span>
                            <p className="text-lg font-black font-mono text-gray-900">
                              {decisionResult.slotComparison.plannedSlot.peakPm25} <span className="text-[9px] text-gray-400">µg</span>
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Risk Level</span>
                            <Badge className={cn("text-[10px] font-bold mt-1", categoryBadgeStyle(decisionResult.slotComparison.plannedSlot.category))}>
                              {decisionResult.slotComparison.plannedSlot.category}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600">
                          Sampled across {decisionResult.slotComparison.plannedSlot.dataPointsCount} hourly atmospheric forecast intervals.
                        </p>
                      </div>
                    )}

                    {/* Alternative Slot */}
                    {decisionResult?.slotComparison?.alternativeSlot ? (
                      <div
                        className={cn(
                          "p-4 rounded-xl border flex flex-col gap-2.5 relative transition-all",
                          decisionResult.slotComparison.preferredSlot === "alternative"
                            ? "border-emerald-500 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-200"
                            : "border-gray-200 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Alternative Window
                            </span>
                            <h3 className="text-base font-extrabold text-gray-900">
                              {decisionResult.slotComparison.alternativeSlot.startTime} – {decisionResult.slotComparison.alternativeSlot.endTime}
                            </h3>
                          </div>
                          {decisionResult.slotComparison.preferredSlot === "alternative" && (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Preferred Window</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-center">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Forecast AQI</span>
                            <p className="text-lg font-black font-mono text-gray-900">
                              {decisionResult.slotComparison.alternativeSlot.averageAqi}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Peak PM2.5</span>
                            <p className="text-lg font-black font-mono text-gray-900">
                              {decisionResult.slotComparison.alternativeSlot.peakPm25} <span className="text-[9px] text-gray-400">µg</span>
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Risk Level</span>
                            <Badge className={cn("text-[10px] font-bold mt-1", categoryBadgeStyle(decisionResult.slotComparison.alternativeSlot.category))}>
                              {decisionResult.slotComparison.alternativeSlot.category}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-xs text-gray-700 leading-relaxed font-medium">
                          {decisionResult.slotComparison.comparisonSummary}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center">
                        <Compass className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs font-bold text-gray-700">No Alternative Window Selected</p>
                        <p className="text-[11px] text-gray-400 max-w-xs mt-0.5">
                          Check &quot;Compare Alternative Window&quot; in the left setup panel to review side-by-side scheduling options.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: Grounded AI Campus Air Advisor */}
          {activeTab === "advisor" && (
            <div className="flex flex-col gap-3.5 animate-in fade-in-50 duration-200">
              <Card className="border-gray-200/80 shadow-xs rounded-2xl bg-gradient-to-br from-white to-indigo-50/20">
                <CardHeader className="pb-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-gray-900">
                          Grounded Campus AI Intelligence
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Strictly constrained institutional guidance verified against CPCB observations.
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
                <CardContent className="space-y-3.5">
                  {explaining ? (
                    <div className="p-6 rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                      <p className="text-xs font-semibold text-gray-700">Synthesizing evidence-based collegiate guidance...</p>
                    </div>
                  ) : aiExplanation ? (
                    <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs text-xs text-gray-800 leading-relaxed space-y-2.5">
                      <div className="whitespace-pre-line font-sans">{aiExplanation.explanation}</div>
                      {aiExplanation.usedFallbackReason && (
                        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-[10px] text-gray-500">
                          <span className="font-semibold text-gray-700">Fallback Notice: </span>
                          {aiExplanation.usedFallbackReason}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Awaiting schedule analysis...</p>
                  )}

                  {/* Quick question prompt chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "Should asthmatic students wear N95?",
                      "Can sports be moved to an indoor gymnasium?",
                      "What are the GRAP Stage IV restrictions?",
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => {
                          setUserQuestion(chip);
                          triggerAiExplanation(decisionResult, chip);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 border border-gray-200 text-[11px] transition-colors cursor-pointer"
                      >
                        💡 {chip}
                      </button>
                    ))}
                  </div>

                  {/* Ask Question Form */}
                  <form onSubmit={handleAskQuestion} className="flex gap-2 pt-1">
                    <Input
                      placeholder="Ask a campus activity question (e.g., 'What indoor sports are approved today?')"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      className="text-xs h-9 bg-white rounded-xl"
                    />
                    <Button
                      type="submit"
                      disabled={qnaLoading || !userQuestion.trim()}
                      className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 gap-1.5 cursor-pointer rounded-xl font-bold"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {qnaLoading ? "Querying..." : "Ask"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Institutional Compliance Footer Note */}
          <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Non-medical administrative support model adhering to Indian CPCB National Standards
            </span>
            <span className="font-mono">AirTrace v2.4</span>
          </div>

        </div>

      </div>
    </div>
  );
}
