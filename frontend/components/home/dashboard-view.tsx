"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Thermometer, Droplets, Wind, Sun, Zap, ArrowRight, Timer,
  CheckCircle2, ChevronDown, RotateCcw, Activity,
  MapPin, ShieldCheck, TrendingDown, BarChart3, Leaf, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAirTelemetry } from "@/hooks/use-air-telemetry";

interface LocationOption {
  name: string; city: string; aqi: number; status: string; statusColor: string;
  headline: string; subtext: string; pm25: number; pm10: number; o3: number;
  temp: string; humidity: string; wind: string; uv: string;
}

const LOCATIONS: LocationOption[] = [
  {
    name: "Williamsburg, Brooklyn, NY", city: "Brooklyn, NY",
    aqi: 38, status: "Good", statusColor: "good",
    headline: "Clean air — excellent conditions right now.",
    subtext: "Maritime air flowing through East River with virtually no fine particles. Safe for all outdoor activities.",
    pm25: 7.8, pm10: 14.2, o3: 22, temp: "68°F", humidity: "45%", wind: "9 mph WSW", uv: "UV 3",
  },
  {
    name: "Downtown Manhattan, NY", city: "Manhattan, NY",
    aqi: 44, status: "Good", statusColor: "good",
    headline: "Optimal conditions across the financial corridor.",
    subtext: "Light crosswinds keeping canyon avenues clear. Minimal diesel soot buildup.",
    pm25: 9.1, pm10: 16.5, o3: 26, temp: "69°F", humidity: "42%", wind: "11 mph S", uv: "UV 4",
  },
  {
    name: "Queens Plaza, NY", city: "Queens Plaza, NY",
    aqi: 52, status: "Moderate", statusColor: "moderate",
    headline: "Acceptable air with minor rush hour eddy.",
    subtext: "Elevated transit interchange causing slight localized PM10 dust increase.",
    pm25: 12.4, pm10: 24.8, o3: 31, temp: "67°F", humidity: "48%", wind: "7 mph E", uv: "UV 3",
  },
  {
    name: "South Congress, Austin, TX", city: "Austin (SoCo), TX",
    aqi: 29, status: "Good", statusColor: "good",
    headline: "Pristine hill country circulation.",
    subtext: "Exceptional purity today. High atmospheric dispersion index.",
    pm25: 5.2, pm10: 10.1, o3: 18, temp: "76°F", humidity: "38%", wind: "12 mph SSE", uv: "UV 6",
  },
  {
    name: "Mission District, SF, CA", city: "San Francisco, CA",
    aqi: 34, status: "Good", statusColor: "good",
    headline: "Cool marine layer cleansing the bay basin.",
    subtext: "Strong onshore breeze scouring particulates out toward the central valley.",
    pm25: 6.9, pm10: 12.0, o3: 19, temp: "61°F", humidity: "65%", wind: "14 mph W", uv: "UV 4",
  },
];

const FORECAST = [
  { time: "Now",   aqi: 38, label: "Good",     color: "text-emerald-600" },
  { time: "3 PM",  aqi: 40, label: "Good",     color: "text-emerald-600" },
  { time: "5 PM",  aqi: 54, label: "Moderate", color: "text-amber-600"   },
  { time: "7 PM",  aqi: 45, label: "Good",     color: "text-emerald-600" },
  { time: "9 PM",  aqi: 35, label: "Good",     color: "text-emerald-600" },
  { time: "11 PM", aqi: 32, label: "Good",     color: "text-emerald-600" },
  { time: "3 AM",  aqi: 29, label: "Good",     color: "text-emerald-600" },
  { time: "7 AM",  aqi: 48, label: "Good",     color: "text-emerald-600" },
];

const QUICK_ACTIONS = [
  { icon: "🏃", title: "Outdoor Workout", badge: "100% Safe", badgeClass: "bg-emerald-100 text-emerald-700", desc: "Perfect conditions for outdoor runs, HIIT, and cycling.", cta: "Safe for Peak HR", href: "/exposure" },
  { icon: "🪟", title: "Ventilate Now", badge: "Recommended", badgeClass: "bg-blue-100 text-blue-700", desc: "Crack windows wide open — flush out indoor CO₂ without dust entry.", cta: "Set 45m Flush Timer", href: "/exposure" },
  { icon: "😷", title: "Mask Status", badge: "Optional", badgeClass: "bg-gray-100 text-gray-600", desc: "Zero particulate protection required. Air quality is in the safe zone.", cta: "N95 — Not Required", href: "/assistant" },
];

const ROUTE_SHORTCUTS = [
  { label: "Route Optimizer", desc: "Compare routes by pollution exposure", href: "/route", icon: TrendingDown, color: "text-blue-600 bg-blue-50" },
  { label: "Campus Safety", desc: "School & college protocol dashboard", href: "/schools", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
];

export function DashboardView() {
  const { telemetry, loading, isUsingLiveLocation, refetch } = useAirTelemetry();
  const [selectedPreset, setSelectedPreset] = useState<LocationOption | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Active display data: prefer live telemetry if no preset override is selected
  const activeData: LocationOption = selectedPreset || (telemetry ? {
    name: isUsingLiveLocation ? "Your Location (Live GPS)" : "Live Telemetry Station",
    city: isUsingLiveLocation ? "Live Location (GPS)" : "Live Station",
    aqi: telemetry.aqi,
    status: telemetry.status,
    statusColor: telemetry.statusColor,
    headline: telemetry.headline,
    subtext: telemetry.subtext,
    pm25: telemetry.pm25,
    pm10: telemetry.pm10,
    o3: telemetry.o3,
    temp: telemetry.temp,
    humidity: telemetry.humidity,
    wind: telemetry.wind,
    uv: telemetry.uv,
  } : LOCATIONS[0]);

  const maxAqi = 150;
  const circumference = 427.2;
  const progressRatio = Math.min(activeData.aqi / maxAqi, 1);
  const strokeDashoffset = circumference * (1 - progressRatio);
  const strokeColor = activeData.aqi <= 50 ? "#10b981" : activeData.aqi <= 100 ? "#f59e0b" : "#ef4444";

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
                {isUsingLiveLocation && !selectedPreset ? "📍 GPS Live" : "Active Location"}
              </span>
              <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                {activeData.city}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
              </span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-white border border-gray-200 shadow-xl p-2 z-40 animate-fade-up">
              <p className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-medium">Switch Station</p>
              
              {/* Option for Live Device Location */}
              <button
                onClick={() => { setSelectedPreset(null); setDropdownOpen(false); refetch(); }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between text-sm cursor-pointer mb-1 border-b border-gray-100",
                  !selectedPreset
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-gray-50 text-gray-700"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Live GPS Location
                </span>
                {telemetry && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    AQI {telemetry.aqi}
                  </span>
                )}
              </button>

              {LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => { setSelectedPreset(loc); setDropdownOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between text-sm cursor-pointer",
                    selectedPreset?.name === loc.name
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <span>{loc.city}</span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                    loc.statusColor === "good" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>AQI {loc.aqi}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Freshness badge */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-gray-500">
            {loading ? "Syncing Open-Meteo..." : "Live Open-Meteo Stream"}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-gray-500">EPA Ground + Sentinel-5P</span>
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
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${strokeColor}, ${strokeColor}80)` }} />
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* SVG Ring Dial */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" fill="transparent" r="68" stroke="#e5e7eb" strokeWidth="10" />
                    <circle
                      cx="80" cy="80" fill="transparent" r="68"
                      stroke={strokeColor} strokeWidth="10"
                      strokeDasharray="427.2"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Real-time AQI</span>
                    <span className="font-mono text-5xl font-bold leading-none tracking-tight" style={{ color: strokeColor }}>
                      {activeData.aqi}
                    </span>
                    <span className={cn("text-xs font-semibold mt-1 px-2.5 py-0.5 rounded-full",
                      activeData.statusColor === "good" ? "status-good" : "status-moderate"
                    )}>
                      {activeData.status}
                    </span>
                  </div>
                </div>

                {/* Verdict */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className={activeData.statusColor === "good" ? "status-good border-0" : "status-moderate border-0"}>
                      ● {activeData.status} Air Quality
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      PM2.5 {activeData.pm25 <= 12 ? "Safe" : "Elevated"}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{activeData.headline}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">{activeData.subtext}</p>

                  {/* Weather row */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-blue-500" /><span>{activeData.temp}</span></div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5"><Droplets className="w-4 h-4 text-blue-400" /><span>{activeData.humidity}</span></div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5"><Wind className="w-4 h-4 text-gray-400" /><span>{activeData.wind}</span></div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5"><Sun className="w-4 h-4 text-amber-500" /><span>{activeData.uv}</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Cards */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Immediate Actions</h3>
              <Badge variant="secondary" className="text-[10px] ml-auto font-mono">Next 4 Hours</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {QUICK_ACTIONS.map((action) => (
                <Card key={action.title} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{action.icon}</span>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", action.badgeClass)}>{action.badge}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{action.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed flex-1">{action.desc}</p>
                    <Link href={action.href} className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 group-hover:translate-x-0.5 transition-transform">
                      {action.cta}<ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pollutant Fingerprint */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Live Molecular Fingerprint
                </CardTitle>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Open-Meteo & EPA</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "PM 2.5", unit: "µg/m³", value: activeData.pm25, max: 25, badge: activeData.pm25 <= 12 ? "WHO Tier 1" : "Elevated", color: activeData.pm25 <= 12 ? "#10b981" : "#f59e0b", desc: "Fine particles — inhalable" },
                  { label: "PM 10",  unit: "µg/m³", value: activeData.pm10, max: 50, badge: activeData.pm10 <= 45 ? "Safe" : "Elevated",  color: activeData.pm10 <= 45 ? "#10b981" : "#f59e0b", desc: "Coarse dust & pollutants" },
                  { label: "O₃",     unit: "µg/m³", value: activeData.o3,   max: 70, badge: activeData.o3 <= 60 ? "Safe" : "Moderate", color: "#8b5cf6", desc: "Ground ozone — photochemical" },
                ].map((pol) => (
                  <div key={pol.label} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{pol.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: pol.color + "20", color: pol.color }}>{pol.badge}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="font-mono text-2xl font-bold text-gray-900">{pol.value}</span>
                      <span className="text-xs text-gray-400">{pol.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((pol.value / pol.max) * 100, 100)}%`, background: pol.color }} />
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
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Today's AQI Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {(telemetry?.forecast && !selectedPreset ? telemetry.forecast : FORECAST).map((slot) => (
                  <div key={slot.time} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    slot.time === "Now" ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50"
                  )}>
                    <span className="text-xs font-mono text-gray-500 w-10 shrink-0">{slot.time}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min((slot.aqi / 100) * 100, 100)}%`, background: slot.aqi <= 50 ? "#10b981" : "#f59e0b" }}
                      />
                    </div>
                    <span className={cn("text-xs font-semibold font-mono w-6 text-right", slot.color)}>{slot.aqi}</span>
                    <span className="text-[10px] text-gray-400 w-14 text-right">{slot.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation shortcuts */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Explore Features</CardTitle>
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
              Station Attribution
            </div>
            <div className="flex items-center justify-between">
              <span>Source</span><span className="font-medium text-gray-700">OpenAQ v3 + EPA-402</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Satellite</span><span className="font-medium text-gray-700">Sentinel-5P (TROPOMI)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fidelity</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                99.8%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
