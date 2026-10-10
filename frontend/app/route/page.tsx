"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import RouteMap from "@/components/route/route-map";
import {
  Navigation, MapPin, ArrowUpDown, Search, Loader2, X,
  Clock, Route as RouteIcon, Wind, AlertTriangle, Info, LocateFixed,
  ChevronDown, ChevronUp, Sparkles, ShieldCheck, HeartPulse,
  Car, Bike, Footprints, CheckCircle2, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ─── Types ──────────────────────────────────────────────────
interface GeocodedPlace {
  displayName: string;
  name: string;
  lat: number;
  lng: number;
  type?: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface RoutePollution {
  estimatedScore: number;
  category: string;
  averagePollutants: Record<string, number | null>;
  sampleCount: number;
  validSampleCount: number;
  allSamplesIdentical: boolean;
  methodology: string;
}

interface PlannedRoute {
  index: number;
  label: string;
  distanceKm: number;
  durationMin: number;
  durationFormatted: string;
  geometry: [number, number][];
  pollution: RoutePollution;
  peakAqi: number;
  exposureIndex: number;
  whoExposureScore: number;
  whoExposureCategory: string;
  estimatedInhaledPm25Ug: number;
  isHealthOptimal?: boolean;
  isFastest?: boolean;
  timeDifferenceMin?: number;
}

interface RouteAiHealthAssessment {
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

interface PlanResult {
  routes: PlannedRoute[];
  routeCount: number;
  healthOptimalRouteIndex: number;
  fastestRouteIndex: number;
  exposureSavingPercent: number;
  aiHealthAssessment: RouteAiHealthAssessment;
  insights: string[];
  dataSource: string;
  pollutionScoreStandard: string;
  fetchedAt: string;
}

// ─── Route colors palette ───────────────────────────────────
const ROUTE_COLORS = [
  { stroke: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  { stroke: "#3b82f6", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", ring: "ring-blue-200", dot: "bg-blue-500" },
  { stroke: "#f59e0b", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", ring: "ring-amber-200", dot: "bg-amber-500" },
];

function getPollutionColor(score: number): string {
  if (score <= 50) return "text-emerald-600";
  if (score <= 100) return "text-green-600";
  if (score <= 200) return "text-amber-600";
  if (score <= 300) return "text-orange-600";
  return "text-rose-600";
}

function getPollutionBgColor(score: number): string {
  if (score <= 50) return "bg-emerald-100 text-emerald-800";
  if (score <= 100) return "bg-green-100 text-green-800";
  if (score <= 200) return "bg-amber-100 text-amber-800";
  if (score <= 300) return "bg-orange-100 text-orange-800";
  return "bg-rose-100 text-rose-800";
}

// ─── Geocode Search Hook ────────────────────────────────────
function useGeocodeSearch() {
  const [results, setResults] = useState<GeocodedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      try {
        const res = await fetch(
          `${BACKEND_URL}/api/routes/geocode?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setResults(json.data);
        }
      } catch {
        // Silently handle geocode search cancellation or failure
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return { results, loading, search, clear };
}

// ─── Location Input Component ───────────────────────────────
function LocationInput({
  value,
  onChange,
  onSelect,
  onClear,
  placeholder,
  label,
  markerColor,
  markerLetter,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (place: GeocodedPlace) => void;
  onClear: () => void;
  placeholder: string;
  label: string;
  markerColor: string;
  markerLetter: string;
}) {
  const { results, loading, search, clear } = useGeocodeSearch();
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
        clear();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [clear]);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative flex items-center">
        <div
          className={cn(
            "absolute left-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
            markerColor
          )}
        >
          {markerLetter}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            search(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          aria-label={label}
          className="w-full h-9 text-xs font-medium text-gray-800 bg-gray-50/80 border border-gray-200 pl-9 pr-8 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
        />
        {value && (
          <button
            onClick={() => {
              onClear();
              clear();
            }}
            className="absolute right-2 p-0.5 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label={`Clear ${label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-7 w-3 h-3 animate-spin text-gray-400" />
        )}
      </div>

      {focused && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
          {results.map((place, i) => (
            <button
              key={`${place.lat}-${place.lng}-${i}`}
              onClick={() => {
                onSelect(place);
                setFocused(false);
                clear();
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-2 border-b border-gray-50 last:border-0"
            >
              <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {place.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {place.address?.suburb
                    ? `${place.address.suburb}, ${place.address.city || place.address.state || ""}`
                    : place.displayName?.substring(0, 60)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Route Planner Page ────────────────────────────────
export default function RoutePage() {
  const [mounted, setMounted] = useState(false);

  // Origin/Destination state
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [originName, setOriginName] = useState("");
  const [destName, setDestName] = useState("");

  // Travel Mode (Driving, Cycling, Walking)
  const [travelMode, setTravelMode] = useState<"driving" | "cycling" | "walking">("driving");

  // Route planning state
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // AI & Insights panel expansion
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [activeVulnerableTab, setActiveVulnerableTab] = useState<"asthma" | "children" | "active">("asthma");

  // Geolocation
  const [locatingUser, setLocatingUser] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Preset Routes for Fast Testing ───────────
  const PRESET_ROUTES = [
    {
      name: "CP → Noida Sec 62",
      origin: { name: "Connaught Place, New Delhi", coords: [28.6315, 77.2167] as [number, number] },
      dest: { name: "Sector 62, Noida", coords: [28.6276, 77.3653] as [number, number] },
    },
    {
      name: "IIT Delhi → Red Fort",
      origin: { name: "IIT Delhi, Hauz Khas", coords: [28.5450, 77.1926] as [number, number] },
      dest: { name: "Red Fort, Old Delhi", coords: [28.6562, 77.2410] as [number, number] },
    },
    {
      name: "India Gate → Cyber City",
      origin: { name: "India Gate, New Delhi", coords: [28.6129, 77.2295] as [number, number] },
      dest: { name: "Cyber City, Gurugram", coords: [28.4950, 77.0895] as [number, number] },
    },
  ];

  // ─── Plan Route ──────────────────────────────────────────
  const handlePlanRoute = useCallback(
    async (
      customOrigin?: { coords: [number, number]; name: string },
      customDest?: { coords: [number, number]; name: string },
      customMode?: "driving" | "cycling" | "walking"
    ) => {
      const orig =
        customOrigin ||
        (originCoords ? { coords: originCoords, name: originName || originText } : null);
      const dest =
        customDest ||
        (destCoords ? { coords: destCoords, name: destName || destText } : null);
      const mode = customMode || travelMode;

      if (!orig || !dest) return;

      setIsPlanning(true);
      setPlanError(null);
      setPlanResult(null);
      setSelectedRouteIndex(0);

      try {
        const res = await fetch(`${BACKEND_URL}/api/routes/plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: { lat: orig.coords[0], lng: orig.coords[1], name: orig.name },
            destination: { lat: dest.coords[0], lng: dest.coords[1], name: dest.name },
            profile: mode,
          }),
        });

        const json = await res.json();

        if (!json.success) {
          setPlanError(json.error || "Failed to plan route");
          return;
        }

        setPlanResult(json.data);
        if (typeof json.data.healthOptimalRouteIndex === "number") {
          setSelectedRouteIndex(json.data.healthOptimalRouteIndex);
        }
      } catch (err: any) {
        setPlanError(err.message || "Network error — is the backend running?");
      } finally {
        setIsPlanning(false);
      }
    },
    [originCoords, destCoords, originName, destName, originText, destText, travelMode]
  );

  // ─── Preset Selection ────────────────────────────────────
  const handleSelectPreset = (preset: (typeof PRESET_ROUTES)[0]) => {
    setOriginText(preset.origin.name);
    setOriginName(preset.origin.name);
    setOriginCoords(preset.origin.coords);

    setDestText(preset.dest.name);
    setDestName(preset.dest.name);
    setDestCoords(preset.dest.coords);

    handlePlanRoute(
      { coords: preset.origin.coords, name: preset.origin.name },
      { coords: preset.dest.coords, name: preset.dest.name }
    );
  };

  // ─── Location Selection ──────────────────────────────────
  const handleOriginSelect = (place: GeocodedPlace) => {
    setOriginText(place.name);
    setOriginName(place.name);
    setOriginCoords([place.lat, place.lng]);
  };

  const handleDestSelect = (place: GeocodedPlace) => {
    setDestText(place.name);
    setDestName(place.name);
    setDestCoords([place.lat, place.lng]);
  };

  const handleSwap = () => {
    const tmpText = originText;
    const tmpCoords = originCoords;
    const tmpName = originName;
    setOriginText(destText);
    setOriginCoords(destCoords);
    setOriginName(destName);
    setDestText(tmpText);
    setDestCoords(tmpCoords);
    setDestName(tmpName);
  };

  const handleClearRoute = () => {
    setPlanResult(null);
    setPlanError(null);
    setSelectedRouteIndex(0);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setOriginCoords([latitude, longitude]);
        setOriginText("Current Location");
        setOriginName("Current Location");
        setLocatingUser(false);
      },
      () => {
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleModeChange = (mode: "driving" | "cycling" | "walking") => {
    setTravelMode(mode);
    if (originCoords && destCoords) {
      handlePlanRoute(undefined, undefined, mode);
    }
  };

  // ─── Derived data ────────────────────────────────────────
  const selectedRoute = planResult?.routes[selectedRouteIndex] || null;
  const canPlan = originCoords !== null && destCoords !== null && !isPlanning;

  // ─── Map click handler ───────────────────────────────────
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!originCoords) {
        setOriginCoords([lat, lng]);
        setOriginText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setOriginName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } else if (!destCoords) {
        setDestCoords([lat, lng]);
        setDestText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setDestName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } else {
        setDestCoords(null);
        setDestText("");
        setDestName("");
        setPlanResult(null);
        setOriginCoords([lat, lng]);
        setOriginText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setOriginName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    },
    [originCoords, destCoords]
  );

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] px-3 md:px-6 py-4 flex flex-col gap-3 max-w-[1700px] mx-auto animate-fade-up">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-emerald flex items-center justify-center text-white shadow-xs">
            <HeartPulse className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Health-Aware Pollution Route Planner
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Inhaled Dose Engine
              </span>
            </h1>
            <p className="text-[11px] text-gray-500 hidden sm:block">
              Judges corridors by cumulative lung exposure and peak hotspots, not just transit time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {planResult?.aiHealthAssessment && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{planResult.aiHealthAssessment.aiProvider}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-500">
            <Wind className="w-3.5 h-3.5 text-teal-600" />
            <span>OSRM + Open-Meteo</span>
          </div>
        </div>
      </div>

      {/* ─── Main Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-stretch">
        {/* ─── Left Panel ──────────────────────────────────── */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-8.5rem)] pr-0.5">
          {/* Controls Box */}
          <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs space-y-3">
            {/* Travel Mode Selector */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Commute Mode
              </span>
              <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-xl">
                {[
                  { id: "driving", label: "Driving", icon: Car },
                  { id: "cycling", label: "Cycling", icon: Bike },
                  { id: "walking", label: "Walking", icon: Footprints },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleModeChange(id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer",
                      travelMode === id
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-500 hover:text-gray-800"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Origin & Destination Inputs */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <div className="w-0.5 h-5 border-r border-dashed border-gray-300" />
                <div className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-200" />
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <LocationInput
                  value={originText}
                  onChange={setOriginText}
                  onSelect={handleOriginSelect}
                  onClear={() => {
                    setOriginText("");
                    setOriginCoords(null);
                    setOriginName("");
                    handleClearRoute();
                  }}
                  placeholder="Search origin..."
                  label="Origin"
                  markerColor="bg-emerald-500"
                  markerLetter="A"
                />
                <LocationInput
                  value={destText}
                  onChange={setDestText}
                  onSelect={handleDestSelect}
                  onClear={() => {
                    setDestText("");
                    setDestCoords(null);
                    setDestName("");
                    handleClearRoute();
                  }}
                  placeholder="Search destination..."
                  label="Destination"
                  markerColor="bg-blue-600"
                  markerLetter="B"
                />
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={handleSwap}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Swap Origin and Destination"
                  aria-label="Swap Origin and Destination"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleUseCurrentLocation}
                  disabled={locatingUser}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-teal-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40"
                  title="Use Current Location as Origin"
                  aria-label="Use Current Location"
                >
                  {locatingUser ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LocateFixed className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Demo Presets */}
            <div className="pt-1 border-t border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Quick Test Corridors
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ROUTES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-gray-200 text-gray-600 transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Hint */}
            {!originCoords && !destCoords && (
              <p className="text-[10px] text-gray-400 text-center">
                Search locations or click on the map to set Point A and Point B.
              </p>
            )}

            {/* Plan button */}
            <button
              onClick={() => handlePlanRoute()}
              disabled={!canPlan}
              className="w-full h-9 rounded-xl gradient-emerald text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95"
            >
              {isPlanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Calculating Respiratory Exposure...
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  Compare Health Impacts & Routes
                </>
              )}
            </button>
          </div>

          {/* ─── Error State ─────────────────────────────── */}
          {planError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <div>
                <p className="font-semibold">Route planning failed</p>
                <p className="text-rose-600 mt-0.5">{planError}</p>
              </div>
            </div>
          )}

          {/* ─── AI Health Diagnosis & Advisor Card ─────────── */}
          {planResult?.aiHealthAssessment && (
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-emerald-800/50 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      BreatheWise AI Medical Assessment
                    </h3>
                    <span className="text-[10px] text-emerald-300 font-mono">
                      {planResult.aiHealthAssessment.model} · Inhaled Dose Model
                    </span>
                  </div>
                </div>

                {planResult.exposureSavingPercent > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    Saves ~{planResult.exposureSavingPercent}% Lung Dose
                  </span>
                )}
              </div>

              {/* Verdict Headline */}
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                <p className="text-xs font-semibold text-emerald-100 leading-snug">
                  {planResult.aiHealthAssessment.verdictHeadline}
                </p>
              </div>

              {/* Clinical Trade-off explanation */}
              {planResult.aiHealthAssessment.clinicalTradeoff && (
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  {planResult.aiHealthAssessment.clinicalTradeoff}
                </p>
              )}

              {/* Vulnerable Groups Tabs */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider mr-1">
                    Vulnerability:
                  </span>
                  {[
                    { id: "asthma", label: "Asthma / Lungs" },
                    { id: "children", label: "Children & Seniors" },
                    { id: "active", label: "Active Commuters" },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveVulnerableTab(id as any)}
                      className={cn(
                        "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer",
                        activeVulnerableTab === id
                          ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40"
                          : "bg-white/5 text-gray-400 hover:text-gray-200"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-2 rounded-xl bg-black/25 text-[11px] text-emerald-200/90 leading-relaxed border border-white/5">
                  {activeVulnerableTab === "asthma" && (
                    <p>🫁 {planResult.aiHealthAssessment.vulnerableGroupsAdvice.asthmaAndRespiratory}</p>
                  )}
                  {activeVulnerableTab === "children" && (
                    <p>👶 {planResult.aiHealthAssessment.vulnerableGroupsAdvice.childrenAndElderly}</p>
                  )}
                  {activeVulnerableTab === "active" && (
                    <p>🚴 {planResult.aiHealthAssessment.vulnerableGroupsAdvice.activeCommuters}</p>
                  )}
                </div>
              </div>

              {/* Recommended Protective Actions */}
              {planResult.aiHealthAssessment.protectiveActions?.length > 0 && (
                <div className="pt-1 border-t border-white/10 space-y-1">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Recommended Precautions
                  </span>
                  {planResult.aiHealthAssessment.protectiveActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Note on OpenAI Key */}
              {planResult.aiHealthAssessment.isMockFallback && (
                <p className="text-[9px] text-emerald-300/70 border-t border-white/10 pt-1.5 text-center">
                  Live OpenAI mode available: Add your <code>OPENAI_API_KEY</code> into backend <code>.env</code>
                </p>
              )}
            </div>
          )}

          {/* ─── Route Cards ─────────────────────────────── */}
          {planResult && planResult.routes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {planResult.routeCount} Alternative{planResult.routeCount > 1 ? "s" : ""} Analyzed
                </span>
                <button
                  onClick={handleClearRoute}
                  className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {planResult.routes.map((route, idx) => {
                const isSelected = idx === selectedRouteIndex;
                const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
                const isHealthiest = idx === planResult.healthOptimalRouteIndex;
                const isFastest = idx === planResult.fastestRouteIndex;

                return (
                  <div
                    key={route.index}
                    onClick={() => setSelectedRouteIndex(idx)}
                    className={cn(
                      "p-3 rounded-2xl border transition-all cursor-pointer bg-white relative overflow-hidden",
                      isSelected
                        ? `border-gray-300 ring-2 ${color.ring} shadow-sm`
                        : "border-gray-200/80 hover:border-gray-300 hover:shadow-xs",
                      isHealthiest && "bg-gradient-to-r from-emerald-50/40 to-white"
                    )}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${route.label}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedRouteIndex(idx);
                    }}
                  >
                    {/* Top status badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isHealthiest && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Health-Optimal (Lowest Lung Exposure)
                          </span>
                        )}
                        {isFastest && !isHealthiest && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            ⚡ Fastest Transit
                          </span>
                        )}
                        {route.peakAqi > 200 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Hotspot: {route.peakAqi} AQI
                          </span>
                        )}
                      </div>

                      {/* Cumulative Inhaled Dose Badge */}
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold text-gray-500 block">
                          Exposure Score
                        </span>
                        <span className={cn("text-sm font-mono font-extrabold", getPollutionColor(route.exposureIndex))}>
                          {route.exposureIndex}
                        </span>
                      </div>
                    </div>

                    {/* Route Title & Key Transit Stats */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 ring-2"
                          style={{
                            backgroundColor: color.stroke,
                            boxShadow: `0 0 0 3px ${color.stroke}22`,
                          }}
                        />
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{route.label}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <RouteIcon className="w-3 h-3" />
                              {route.distanceKm} km
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {route.durationFormatted}
                            </span>
                            {route.timeDifferenceMin && route.timeDifferenceMin > 0 && (
                              <span className="text-[10px] text-gray-400">
                                (+{route.timeDifferenceMin} min)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] text-gray-400">Avg AQI:</span>
                          <span className={cn("font-mono font-bold text-xs", getPollutionColor(route.pollution.estimatedScore))}>
                            {route.pollution.estimatedScore}
                          </span>
                        </div>
                        <span className={cn(
                          "text-[9px] font-semibold px-1.5 py-0.5 rounded-full inline-block mt-0.5",
                          getPollutionBgColor(route.pollution.estimatedScore)
                        )}>
                          {route.pollution.category}
                        </span>
                      </div>
                    </div>

                    {/* Health Metrics Grid */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-gray-100 text-center">
                      <div className="p-1 rounded-lg bg-gray-50">
                        <span className="text-[9px] text-gray-400 block">Peak Hotspot</span>
                        <span className={cn("text-[11px] font-mono font-bold", getPollutionColor(route.peakAqi))}>
                          {route.peakAqi} AQI
                        </span>
                      </div>
                      <div className="p-1 rounded-lg bg-gray-50">
                        <span className="text-[9px] text-gray-400 block">Inhaled PM2.5</span>
                        <span className="text-[11px] font-mono font-bold text-gray-800">
                          ~{route.estimatedInhaledPm25Ug} µg
                        </span>
                      </div>
                      <div className="p-1 rounded-lg bg-gray-50">
                        <span className="text-[9px] text-gray-400 block">WHO Exposure</span>
                        <span className="text-[11px] font-semibold text-gray-800">
                          {route.whoExposureCategory}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Selected Route Details ─────────────────── */}
          {selectedRoute && (
            <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-600" />
                  Route Telemetry: {selectedRoute.label}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {travelMode} mode
                </span>
              </div>

              {/* Pollutant Concentrations Along Path */}
              {selectedRoute.pollution.averagePollutants.pm2_5 !== null && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Average Atmospheric Concentrations Along Corridor
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: "pm2_5", label: "PM2.5", unit: "µg/m³" },
                      { key: "pm10", label: "PM10", unit: "µg/m³" },
                      { key: "no2", label: "NO₂", unit: "µg/m³" },
                      { key: "o3", label: "O₃", unit: "µg/m³" },
                    ].map(({ key, label, unit }) => {
                      const val = selectedRoute.pollution.averagePollutants[key];
                      return (
                        <div key={key} className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 text-center">
                          <span className="text-[9px] text-gray-400 block">{label}</span>
                          <span className="font-mono font-semibold text-[11px] text-gray-800">
                            {val !== null ? val : "—"}
                          </span>
                          <span className="text-[8px] text-gray-400 block">{unit}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Methodology note */}
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-[10px] text-gray-500 leading-relaxed">
                <strong>Respiratory Inhaled Dose Formulation:</strong>{" "}
                Calculated as <code>Average AQI × (Duration / 10)</code>, combined with minute ventilation rates for {travelMode}.
                Corridors with lower cumulative scores produce less deep-lung particulate deposition.
              </div>
            </div>
          )}

          {/* ─── Insights Panel ──────────────────────────── */}
          {planResult && planResult.insights.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <button
                onClick={() => setInsightsExpanded(!insightsExpanded)}
                className="w-full flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Corridor Comparison Insights
                </span>
                {insightsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
              {insightsExpanded && (
                <div className="px-3 pb-3 space-y-1.5">
                  {planResult.insights.map((insight, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-[11px] text-gray-600 leading-relaxed"
                    >
                      <span className="text-gray-300 mt-0.5">•</span>
                      <p>{insight}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Empty state ─────────────────────────────── */}
          {!planResult && !isPlanning && !planError && (
            <div className="p-6 rounded-2xl border border-dashed border-gray-200 text-center">
              <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">
                Search locations above or click on the map to set Point A and Point B.
                The engine will evaluate alternatives for health and pollution exposure.
              </p>
            </div>
          )}
        </div>

        {/* ─── Map (Right Panel) ─────────────────────────── */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col min-h-[500px] lg:min-h-full">
          {mounted ? (
            <RouteMap
              origin={
                originCoords
                  ? { label: originName || originText, coords: originCoords }
                  : null
              }
              destination={
                destCoords
                  ? { label: destName || destText, coords: destCoords }
                  : null
              }
              routes={
                planResult
                  ? planResult.routes.map((r, i) => ({
                      index: i,
                      label: r.label,
                      geometry: r.geometry,
                      strokeColor: ROUTE_COLORS[i % ROUTE_COLORS.length].stroke,
                      pollutionScore: r.exposureIndex, // Map shows cumulative lung exposure score
                    }))
                  : []
              }
              selectedRouteIndex={selectedRouteIndex}
              onSelectRoute={setSelectedRouteIndex}
              onMapClick={handleMapClick}
              isPlanning={isPlanning}
            />
          ) : (
            <div className="w-full h-full min-h-[500px] rounded-2xl bg-slate-100 flex items-center justify-center border border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>Loading Map...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
