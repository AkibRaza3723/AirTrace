"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Zap,
  ArrowRight,
  ChevronDown,
  RotateCcw,
  Activity,
  MapPin,
  ShieldCheck,
  TrendingDown,
  BarChart3,
  Leaf,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAirTelemetry } from "@/hooks/use-air-telemetry";

interface LocationOption {
  name: string;
  city: string;
  lat?: number;
  lng?: number;
  aqi: number;
  status: string;
  statusColor: string;
  headline: string;
  subtext: string;
  prominentPollutant?: string;
  pm25: number;
  pm10: number;
  o3: number;
  no2?: number;
  so2?: number;
  co?: number;
  temp: string;
  humidity: string;
  wind: string;
  uv: string;
  forecast?: Array<{
    time: string;
    aqi: number;
    label: string;
    color: string;
  }>;
}

const DEFAULT_FORECAST = [
  { time: "Now", aqi: 145, label: "Moderate", color: "text-amber-600" },
  { time: "1 PM", aqi: 160, label: "Moderate", color: "text-amber-600" },
  { time: "3 PM", aqi: 185, label: "Moderate", color: "text-amber-600" },
  { time: "5 PM", aqi: 215, label: "Poor", color: "text-orange-600" },
  { time: "7 PM", aqi: 240, label: "Poor", color: "text-orange-600" },
  { time: "9 PM", aqi: 280, label: "Poor", color: "text-orange-600" },
  { time: "11 PM", aqi: 310, label: "Very Poor", color: "text-rose-600" },
  { time: "7 AM", aqi: 290, label: "Poor", color: "text-orange-600" },
];

const ROUTE_SHORTCUTS = [
  {
    label: "Route Optimizer",
    desc: "Compare commuter routes by particulate exposure",
    href: "/route",
    icon: TrendingDown,
    color: "text-blue-600 bg-blue-50",
  },
  {
    label: "Campus Decision System",
    desc: "Collegiate & school outdoor activity safety clearance",
    href: "/schools",
    icon: ShieldCheck,
    color: "text-emerald-600 bg-emerald-50",
  },
];

export function DashboardView() {
  const { telemetry, stations, loading, isUsingLiveLocation, refetch, fetchByCoords } = useAirTelemetry();
  const [selectedPreset, setSelectedPreset] = useState<LocationOption | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fallback: LocationOption = {
    name: "Anand Vihar, Delhi",
    city: "Anand Vihar (East Delhi)",
    aqi: 245,
    status: "Poor",
    statusColor: "poor",
    headline: "Poor Air Quality — CPCB NAQI 245",
    subtext: "Breathing discomfort to most people on prolonged outdoor exposure.",
    prominentPollutant: "PM2.5",
    pm25: 112.5,
    pm10: 240.0,
    o3: 45.0,
    no2: 24.5,
    temp: "28°C",
    humidity: "62%",
    wind: "9 km/h",
    uv: "UV 3",
  };

  // Active display data: prefer selected station, then live telemetry, then first Delhi station
  const activeData: LocationOption = selectedPreset || (telemetry ? {
    name: isUsingLiveLocation ? "Your Location (Live GPS)" : "Live Telemetry Station",
    city: isUsingLiveLocation ? "Live Location (GPS)" : "Live Station",
    aqi: telemetry.aqi,
    status: telemetry.status,
    statusColor: telemetry.statusColor,
    headline: telemetry.headline,
    subtext: telemetry.subtext,
    prominentPollutant: telemetry.prominentPollutant ?? "PM2.5",
    pm25: telemetry.pm25,
    pm10: telemetry.pm10,
    o3: telemetry.o3,
    no2: telemetry.no2,
    so2: telemetry.so2,
    co: telemetry.co,
    temp: telemetry.temp,
    humidity: telemetry.humidity,
    wind: telemetry.wind,
    uv: telemetry.uv,
  } : (stations[0] || fallback));

  // CPCB NAQI scale reaches 500
  const maxAqi = 500;
  const strokeDashoffset = 427.2 * (1 - Math.min(activeData.aqi / maxAqi, 1));

  // CPCB 6-tier color mapping
  const getCpcbColor = (aqi: number) => {
    if (aqi <= 50) return "#10b981"; // Good (Emerald)
    if (aqi <= 100) return "#16a34a"; // Satisfactory (Green)
    if (aqi <= 200) return "#f59e0b"; // Moderate (Amber)
    if (aqi <= 300) return "#ea580c"; // Poor (Orange)
    if (aqi <= 400) return "#e11d48"; // Very Poor (Rose)
    return "#991b1b"; // Severe (Dark Red)
  };

  const strokeColor = getCpcbColor(activeData.aqi);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Good":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "Satisfactory":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Moderate":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "Poor":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "Very Poor":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      case "Severe":
      default:
        return "bg-red-200 text-red-900 border border-red-300";
    }
  };

  // Dynamic quick action advisories aligned with Indian CPCB / GRAP health advisories
  const getDynamicActions = (aqi: number) => {
    if (aqi <= 50) {
      return [
        { icon: "🏃", title: "Outdoor Workout", badge: "Approved", badgeClass: "bg-emerald-100 text-emerald-700", desc: "Clean atmospheric air. Peak cardiovascular running, sports, and cycling fully approved.", cta: "Safe for High HR", href: "/exposure" },
        { icon: "🪟", title: "Ventilate Indoors", badge: "Recommended", badgeClass: "bg-blue-100 text-blue-700", desc: "Open windows to flush out indoor carbon dioxide with fresh ambient air.", cta: "Natural Aeration", href: "/exposure" },
        { icon: "😷", title: "Mask Status", badge: "Not Required", badgeClass: "bg-gray-100 text-gray-600", desc: "Particulate filtration unnecessary. Air quality meets Clean Air goals.", cta: "No Protection Needed", href: "/assistant" },
      ];
    }
    if (aqi <= 100) {
      return [
        { icon: "🏃", title: "Outdoor Workout", badge: "Approved", badgeClass: "bg-green-100 text-green-700", desc: "Minor breathing discomfort to sensitive individuals only. Standard workouts approved.", cta: "Normal Intensity", href: "/exposure" },
        { icon: "🪟", title: "Ventilate Indoors", badge: "Approved", badgeClass: "bg-blue-100 text-blue-700", desc: "Normal ventilation acceptable. Avoid peak highway commute hours.", cta: "Moderate Flush", href: "/exposure" },
        { icon: "😷", title: "Mask Status", badge: "Optional", badgeClass: "bg-gray-100 text-gray-600", desc: "Sensitive persons with chronic asthma may consider lightweight filtration.", cta: "Optional for Sensitive", href: "/assistant" },
      ];
    }
    if (aqi <= 200) {
      return [
        { icon: "🏃", title: "Outdoor Workout", badge: "Caution", badgeClass: "bg-amber-100 text-amber-700", desc: "Moderate exertion. Reduce high-intensity interval drills; asthmatics should train indoors.", cta: "Moderate PE Only", href: "/exposure" },
        { icon: "🪟", title: "Ventilate Indoors", badge: "Selective", badgeClass: "bg-amber-100 text-amber-700", desc: "Ventilate briefly during afternoon sun when ground inversions lift.", cta: "Controlled Aeration", href: "/exposure" },
        { icon: "😷", title: "Mask Status", badge: "Sensitive Groups", badgeClass: "bg-amber-100 text-amber-700", desc: "Asthmatics and elderly should wear particulate masks during transit.", cta: "N95 for Sensitive", href: "/assistant" },
      ];
    }
    if (aqi <= 300) {
      return [
        { icon: "🏃", title: "Outdoor Workout", badge: "Restrict", badgeClass: "bg-orange-100 text-orange-700", desc: "Poor air quality. Relocate athletics and sports into indoor gymnasiums.", cta: "Move Training Indoors", href: "/exposure" },
        { icon: "🪟", title: "Ventilate Indoors", badge: "Seal Windows", badgeClass: "bg-orange-100 text-orange-700", desc: "Keep windows shut. Turn on indoor HEPA filtration to clear particulates.", cta: "Run HEPA Purifier", href: "/exposure" },
        { icon: "😷", title: "Mask Status", badge: "Recommended", badgeClass: "bg-orange-100 text-orange-700", desc: "N95 / FFP2 particulate mask advised for outdoor campus and street transit.", cta: "Wear N95 Filter", href: "/assistant" },
      ];
    }
    return [
      { icon: "🏃", title: "Outdoor Workout", badge: "Suspended", badgeClass: "bg-red-200 text-red-800", desc: "Very Poor / Severe conditions. All outdoor cardiovascular athletics suspended under GRAP.", cta: "Indoor Only", href: "/exposure" },
      { icon: "🪟", title: "Ventilate Indoors", badge: "Seal & Purify", badgeClass: "bg-red-200 text-red-800", desc: "Seal entryways. Operate HEPA air purifiers continuously on recirculate mode.", cta: "Continuous HEPA", href: "/exposure" },
      { icon: "😷", title: "Mask Status", badge: "Mandatory N95", badgeClass: "bg-red-200 text-red-800", desc: "Mandatory particulate respirator (N95/FFP2) when stepping outdoors.", cta: "Tight Seal N95", href: "/assistant" },
    ];
  };

  const dynamicActions = getDynamicActions(activeData.aqi);

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-up">
      {/* Header Row */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        {/* Location Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                {isUsingLiveLocation && !selectedPreset ? "📍 GPS Live" : "Monitoring Station"}
              </span>
              <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                {activeData.city}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
              </span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 rounded-xl bg-white border border-gray-200 shadow-xl p-2 z-40 animate-fade-up">
              <p className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                Switch Indian Regional Station
              </p>

              {/* Option for Live Device Location */}
              <button
                onClick={() => {
                  setSelectedPreset(null);
                  setDropdownOpen(false);
                  refetch();
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between text-sm cursor-pointer mb-1 border-b border-gray-100",
                  !selectedPreset ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Live GPS Location
                </span>
                {telemetry && (
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      getStatusBadge(telemetry.status)
                    )}
                  >
                    NAQI {telemetry.aqi}
                  </span>
                )}
              </button>

              {stations.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => {
                    setSelectedPreset(loc);
                    setDropdownOpen(false);
                    if (loc.lat && loc.lng) {
                      fetchByCoords(loc.lat, loc.lng);
                    }
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between text-sm cursor-pointer",
                    selectedPreset?.name === loc.name
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900 leading-tight">{loc.name}</p>
                    <p className="text-[11px] text-gray-400">{loc.city}</p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
                      getStatusBadge(loc.status)
                    )}
                  >
                    NAQI {loc.aqi}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Freshness & Methodology Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-gray-700 font-medium">
            {loading ? "Syncing Telemetry..." : "India CPCB NAQI Standard"}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-gray-500 text-xs">Open-Meteo High-Res Stream</span>
          <button
            onClick={() => refetch()}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            title="Refresh live telemetry"
          >
            <RotateCcw className={cn("w-3.5 h-3.5", loading && "animate-spin text-blue-600")} />
          </button>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT: AQI Hero + Actions (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          {/* Primary AQI Card */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{ background: `linear-gradient(90deg, ${strokeColor}, ${strokeColor}80)` }}
            />
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* SVG Ring Dial (0 - 500 CPCB Scale) */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-48 h-48 -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" fill="transparent" r="68" stroke="#f1f5f9" strokeWidth="11" />
                    <circle
                      cx="80"
                      cy="80"
                      fill="transparent"
                      r="68"
                      stroke={strokeColor}
                      strokeWidth="11"
                      strokeDasharray="427.2"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      CPCB NAQI (India)
                    </span>
                    <span
                      className="font-mono text-5xl font-black leading-none tracking-tight my-0.5"
                      style={{ color: strokeColor }}
                    >
                      {activeData.aqi}
                    </span>
                    <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full", getStatusBadge(activeData.status))}>
                      {activeData.status}
                    </span>
                  </div>
                </div>

                {/* Verdict & Context */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className={cn("border-0 font-bold", getStatusBadge(activeData.status))}>
                      ● {activeData.status} Category
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                      Prominent: {activeData.prominentPollutant ?? "PM2.5"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] text-gray-500">
                      0–500 National Scale
                    </Badge>
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-1">{activeData.headline}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">{activeData.subtext}</p>

                  {/* Weather row */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-blue-500" />
                      <span>{activeData.temp}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <span>{activeData.humidity}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-4 h-4 text-gray-400" />
                      <span>{activeData.wind}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>{activeData.uv}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Cards (CPCB / GRAP-Aligned) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Immediate Activity Protocols</h3>
              <Badge variant="secondary" className="text-[10px] ml-auto font-mono">
                Indian Health Criteria
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dynamicActions.map((action) => (
                <Card key={action.title} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{action.icon}</span>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", action.badgeClass)}>
                        {action.badge}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{action.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed flex-1">{action.desc}</p>
                    <Link
                      href={action.href}
                      className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 group-hover:translate-x-0.5 transition-transform"
                    >
                      {action.cta}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pollutant Sub-Indices Grid */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Live Molecular Fingerprint (CPCB NAQI Breakpoints)
                </CardTitle>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                  CPCB NAQI Piecewise Math
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "PM 2.5",
                    unit: "µg/m³",
                    value: activeData.pm25,
                    max: 250,
                    badge:
                      activeData.pm25 <= 30
                        ? "Good"
                        : activeData.pm25 <= 60
                        ? "Satisfactory"
                        : activeData.pm25 <= 90
                        ? "Moderate"
                        : activeData.pm25 <= 120
                        ? "Poor"
                        : "Very Poor / Severe",
                    color:
                      activeData.pm25 <= 30
                        ? "#10b981"
                        : activeData.pm25 <= 60
                        ? "#16a34a"
                        : activeData.pm25 <= 90
                        ? "#f59e0b"
                        : "#ea580c",
                    desc: "Fine respirable particles — deep lung penetration",
                  },
                  {
                    label: "PM 10",
                    unit: "µg/m³",
                    value: activeData.pm10,
                    max: 430,
                    badge:
                      activeData.pm10 <= 50
                        ? "Good"
                        : activeData.pm10 <= 100
                        ? "Satisfactory"
                        : activeData.pm10 <= 250
                        ? "Moderate"
                        : "Poor / Severe",
                    color:
                      activeData.pm10 <= 50
                        ? "#10b981"
                        : activeData.pm10 <= 100
                        ? "#16a34a"
                        : activeData.pm10 <= 250
                        ? "#f59e0b"
                        : "#ea580c",
                    desc: "Coarse particulate matter — dust & vehicular exhaust",
                  },
                  {
                    label: "O₃ (Ozone)",
                    unit: "µg/m³",
                    value: activeData.o3,
                    max: 200,
                    badge: activeData.o3 <= 50 ? "Good" : activeData.o3 <= 100 ? "Satisfactory" : "Moderate",
                    color: activeData.o3 <= 100 ? "#16a34a" : "#8b5cf6",
                    desc: "Ground-level photochemical ozone",
                  },
                ].map((pol) => (
                  <div key={pol.label} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {pol.label}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: pol.color + "20", color: pol.color }}
                      >
                        {pol.badge}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="font-mono text-2xl font-bold text-gray-900">{pol.value}</span>
                      <span className="text-xs text-gray-400">{pol.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min((pol.value / pol.max) * 100, 100)}%`,
                          background: pol.color,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 italic">{pol.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Forecast + Shortcuts (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          {/* Hourly Forecast */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" /> Today's CPCB AQI Progression
                </span>
                <span className="text-[10px] font-mono text-gray-400">Next 8 Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {((selectedPreset?.forecast && selectedPreset.forecast.length > 0
                  ? selectedPreset.forecast
                  : telemetry?.forecast) || DEFAULT_FORECAST).map((slot) => (
                  <div
                    key={slot.time}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      slot.time === "Now" ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50"
                    )}
                  >
                    <span className="text-xs font-mono text-gray-500 w-10 shrink-0">{slot.time}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((slot.aqi / 500) * 100, 100)}%`,
                          background: getCpcbColor(slot.aqi),
                        }}
                      />
                    </div>
                    <span className={cn("text-xs font-bold font-mono w-8 text-right", slot.color)}>
                      {slot.aqi}
                    </span>
                    <span className="text-[10px] text-gray-400 w-20 text-right truncate">{slot.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation shortcuts */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Decision Support Ecosystem</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {ROUTE_SHORTCUTS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                >
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", item.color.split(" ")[1])}>
                    <item.icon className={cn("w-4 h-4", item.color.split(" ")[0])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
              <Link
                href="/assistant"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity mt-1 shadow-sm"
              >
                <Leaf className="w-4 h-4" />
                Ask the AI Air Advisor
              </Link>
            </CardContent>
          </Card>

          {/* Station attribution */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-gray-700">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              Standard & Telemetry Attribution
            </div>
            <div className="flex items-center justify-between">
              <span>Standard</span>
              <span className="font-semibold text-gray-800">CPCB National Air Quality Index (India NAQI)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Atmospheric Feed</span>
              <span className="font-medium text-gray-700">Open-Meteo High-Resolution Grid Telemetry</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pollutants Monitored</span>
              <span className="font-medium text-gray-700">PM2.5, PM10, O3, NO2, SO2, CO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
