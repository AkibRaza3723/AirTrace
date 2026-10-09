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
  Timer,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Radio,
  Radar,
  Flame,
  Activity,
  Layers,
  ShieldCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationOption {
  name: string;
  city: string;
  aqi: number;
  vibe: string;
  headline: string;
  subtext: string;
  pm25: number;
  pm10: number;
  o3: number;
  temp: string;
  humidity: string;
  wind: string;
  uv: string;
}

const LOCATIONS: LocationOption[] = [
  {
    name: "Williamsburg, Brooklyn, NY",
    city: "Williamsburg, NY",
    aqi: 38,
    vibe: "CHILL & CRISP 🍃",
    headline: "The air outside is immaculate right now.",
    subtext: "Zero hesitation needed. Clean maritime draft flowing through East River with virtually no trapped fine particles.",
    pm25: 7.8,
    pm10: 14.2,
    o3: 22,
    temp: "68°F",
    humidity: "45% Hum",
    wind: "9 mph WSW",
    uv: "UV 3 (Low)",
  },
  {
    name: "Downtown Manhattan, NY",
    city: "Downtown Manhattan, NY",
    aqi: 44,
    vibe: "FRESH & CLEAR ✨",
    headline: "Optimal conditions across the financial corridor.",
    subtext: "Light crosswinds keeping canyon avenues clear. Minimal diesel soot buildup.",
    pm25: 9.1,
    pm10: 16.5,
    o3: 26,
    temp: "69°F",
    humidity: "42% Hum",
    wind: "11 mph S",
    uv: "UV 4 (Moderate)",
  },
  {
    name: "Queens Plaza, NY",
    city: "Queens Plaza, NY",
    aqi: 52,
    vibe: "MODERATE FLOW ⛅",
    headline: "Acceptable air with minor rush hour eddy.",
    subtext: "Elevated transit interchange causing slight localized PM10 dust increase.",
    pm25: 12.4,
    pm10: 24.8,
    o3: 31,
    temp: "67°F",
    humidity: "48% Hum",
    wind: "7 mph E",
    uv: "UV 3 (Low)",
  },
  {
    name: "South Congress, Austin, TX",
    city: "Austin (SoCo), TX",
    aqi: 29,
    vibe: "PRISTINE BREEZE 🌿",
    headline: "Pristine hill country circulation.",
    subtext: "Exceptional purity today. High atmospheric dispersion index.",
    pm25: 5.2,
    pm10: 10.1,
    o3: 18,
    temp: "76°F",
    humidity: "38% Hum",
    wind: "12 mph SSE",
    uv: "UV 6 (High)",
  },
  {
    name: "Mission District, SF, CA",
    city: "San Francisco, CA",
    aqi: 34,
    vibe: "PACIFIC CRISP 🌊",
    headline: "Cool marine layer cleansing the bay basin.",
    subtext: "Strong onshore breeze scouring particulates out toward the central valley.",
    pm25: 6.9,
    pm10: 12.0,
    o3: 19,
    temp: "61°F",
    humidity: "65% Hum",
    wind: "14 mph W",
    uv: "UV 4 (Moderate)",
  },
];

const FORECAST_HOURLY = [
  { time: "NOW", aqi: 38, icon: "🍃", label: "Crisp", highlight: true },
  { time: "3 PM", aqi: 40, icon: "✨", label: "Good" },
  { time: "5 PM", aqi: 54, icon: "🚗", label: "Moderate" },
  { time: "7 PM", aqi: 45, icon: "🏃", label: "Prime" },
  { time: "9 PM", aqi: 35, icon: "🌙", label: "Chill" },
  { time: "11 PM", aqi: 32, icon: "🪟", label: "Ventilate" },
  { time: "3 AM", aqi: 29, icon: "❄️", label: "Pristine" },
  { time: "7 AM", aqi: 48, icon: "☕", label: "Good" },
];

export default function HomePage() {
  const [selectedLoc, setSelectedLoc] = useState<LocationOption>(LOCATIONS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // SVG circular dial parameters (circumference for r=68 is ~427.2)
  const maxAqi = 150;
  const circumference = 427.2;
  const progressRatio = Math.min(selectedLoc.aqi / maxAqi, 1);
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="relative w-full overflow-hidden px-6 md:px-12 py-6 flex flex-col gap-8">
      {/* Dynamic Atmospheric Glow Background Backplate */}
      <div className="absolute -top-32 left-1/4 w-[580px] h-[580px] bg-[var(--primary)]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-[420px] h-[420px] bg-[var(--primary-container)]/15 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-12 w-[360px] h-[360px] bg-[var(--tertiary)]/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Top Bar / Geo-Telemetry Stream Header */}
      <section className="w-full flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Location Custom Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--surface-container-high)]/90 hover:bg-[var(--surface-container-highest)] border border-white/[0.08] shadow-md transition-all text-left cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-ping shrink-0" />
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1">
                  CURRENT AIR COLUMN <Activity className="w-3 h-3 text-[var(--primary)]" />
                </span>
                <span className="font-heading text-sm sm:text-base font-semibold text-[var(--on-surface)] flex items-center gap-1">
                  {selectedLoc.name}
                  <ChevronDown className="w-4 h-4 text-[var(--primary)] group-hover:translate-y-0.5 transition-transform" />
                </span>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 rounded-xl bg-[var(--surface-container-highest)]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2 z-40">
                <p className="px-3 py-1 font-mono text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">
                  SWITCH AIR SHED
                </p>
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      setSelectedLoc(loc);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between text-xs cursor-pointer",
                      selectedLoc.name === loc.name
                        ? "bg-[var(--primary-container)]/20 text-[var(--primary)] font-semibold"
                        : "hover:bg-white/[0.05] text-[var(--on-surface)]"
                    )}
                  >
                    <span>{loc.city}</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
                      AQI {loc.aqi}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-container)]/70 border border-white/[0.06] text-xs font-mono">
            <span className="text-[var(--on-surface-variant)]">MICRO-SECTOR:</span>
            <span className="text-[var(--primary)] font-semibold">GRID BK-409A</span>
            <span className="text-[var(--outline-variant)]">•</span>
            <span className="text-[var(--on-surface)]">Elevation 46ft</span>
          </div>
        </div>

        {/* Sensor Fidelity Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-container-high)]/60 border border-white/[0.06] backdrop-blur-md shadow-sm text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
          <span className="text-[var(--on-surface-variant)]">
            Updated <strong className="text-[var(--on-surface)]">2m ago</strong> • EPA Ground + Sentinel-5P •{" "}
            <strong className="text-[var(--primary)]">99.8% Fidelity</strong>
          </span>
          <button
            onClick={() => setSelectedLoc({ ...selectedLoc })}
            className="p-1 rounded-full hover:bg-white/10 text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors ml-1 cursor-pointer"
            title="Refresh stream"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Main Live Air Dashboard Grid (Desktop 12-Col System) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT/CENTER HERO: Giant Air Vibe & Risk Prescription Card (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Bioluminescent Primary Air Vibe Card */}
          <div className="relative w-full rounded-2xl bg-[var(--surface-container-low)]/90 border border-white/[0.08] backdrop-blur-2xl p-6 sm:p-8 shadow-xl overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--primary-container)] to-[var(--tertiary)]" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              {/* AQI Big Visual Ring Dial */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 160 160">
                  <circle
                    className="text-[var(--surface-container-highest)]/40"
                    cx="80"
                    cy="80"
                    fill="transparent"
                    r="68"
                    stroke="currentColor"
                    strokeWidth="12"
                  />
                  <circle
                    className="text-[var(--primary)] transition-all duration-1000 ease-out"
                    cx="80"
                    cy="80"
                    fill="transparent"
                    r="68"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray="427.2"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">
                    REALTIME AQI
                  </span>
                  <span className="font-mono text-5xl font-bold leading-none tracking-tight text-[var(--primary)] drop-shadow-[0_0_24px_rgba(78,222,163,0.4)]">
                    {selectedLoc.aqi}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--primary-fixed)] mt-1 px-2 py-0.5 rounded-full bg-[var(--primary)]/20 uppercase font-semibold">
                    HEALTHY ZONE
                  </span>
                </div>
              </div>

              {/* Vibe Verdict & Commentary */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-[var(--primary)] text-[var(--on-primary)] font-mono text-xs font-bold shadow-md">
                    {selectedLoc.vibe}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[var(--surface-container)] font-mono text-[11px] text-[var(--on-surface-variant)] border border-white/[0.05]">
                    PM2.5 BIOMARKER OK
                  </span>
                </div>

                <h2 className="font-heading text-2xl font-bold tracking-tight text-[var(--on-surface)] mt-1 mb-2">
                  {selectedLoc.headline}
                </h2>
                <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
                  {selectedLoc.subtext}
                </p>

                {/* Micro-weather Pill Bar */}
                <div className="mt-6 flex flex-wrap items-center gap-3 pt-3 bg-[var(--surface-container-lowest)]/60 border border-white/[0.04] p-3 rounded-xl font-mono text-xs text-[var(--on-surface)]">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-[var(--primary)]" />
                    <span>{selectedLoc.temp}</span>
                  </div>
                  <span className="text-[var(--outline-variant)]">•</span>
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-[var(--tertiary)]" />
                    <span>{selectedLoc.humidity}</span>
                  </div>
                  <span className="text-[var(--outline-variant)]">•</span>
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-[var(--primary)]" />
                    <span>{selectedLoc.wind}</span>
                  </div>
                  <span className="text-[var(--outline-variant)]">•</span>
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-[var(--secondary)]" />
                    <span>{selectedLoc.uv}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Prescription Bento ("What should I do right now?") */}
          <div className="w-full rounded-2xl bg-[var(--surface-container-low)]/80 border border-white/[0.06] backdrop-blur-xl p-6 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="font-heading text-lg font-bold text-[var(--on-surface)]">
                  Immediate Action Verdicts
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[var(--on-surface-variant)]">
                AUTO-CALCULATED FOR NEXT 4 HOURS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Prescription 1: Outdoor Workout */}
              <div className="rounded-xl bg-[var(--surface-container)]/70 border border-white/[0.06] p-4 hover:bg-[var(--surface-container-high)] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-10 h-10 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-lg">
                      🏃
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-mono text-[10px] font-bold">
                      100% OK
                    </span>
                  </div>
                  <h4 className="font-heading text-sm font-bold text-[var(--on-surface)]">
                    Outdoor Workout
                  </h4>
                  <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                    Perfect conditions for your long riverfront run, outdoor skating, or HIIT outdoors.
                  </p>
                </div>
                <div className="mt-4 pt-2 flex items-center text-[var(--primary)] text-xs font-semibold gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Safe Peak HR Zone</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Prescription 2: Windows & Ventilation */}
              <div className="rounded-xl bg-[var(--surface-container)]/70 border border-white/[0.06] p-4 hover:bg-[var(--surface-container-high)] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-10 h-10 rounded-full bg-[var(--tertiary-container)]/20 text-[var(--tertiary)] flex items-center justify-center text-lg">
                      🪟
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--tertiary)]/10 text-[var(--tertiary)] font-mono text-[10px] font-bold">
                      PURGE CO₂
                    </span>
                  </div>
                  <h4 className="font-heading text-sm font-bold text-[var(--on-surface)]">
                    Windows & Airflow
                  </h4>
                  <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                    Crack them wide open. Clear out built-up indoor carbon dioxide without dust.
                  </p>
                </div>
                <div className="mt-4 pt-2 flex items-center text-[var(--tertiary)] text-xs font-semibold gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Set 45m Flush Timer</span>
                  <Timer className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Prescription 3: Mask Requirement */}
              <div className="rounded-xl bg-[var(--surface-container)]/70 border border-white/[0.06] p-4 hover:bg-[var(--surface-container-high)] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-10 h-10 rounded-full bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] flex items-center justify-center text-lg">
                      😷
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] font-mono text-[10px]">
                      OPTIONAL
                    </span>
                  </div>
                  <h4 className="font-heading text-sm font-bold text-[var(--on-surface)]">
                    Mask Status
                  </h4>
                  <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                    Zero particulate protection needed today. Wear one purely for cyber style.
                  </p>
                </div>
                <div className="mt-4 pt-2 flex items-center text-[var(--on-surface-variant)] text-xs font-semibold gap-1">
                  <span>N95 Respiration: Off</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Molecular Fingerprint Grid */}
          <div className="w-full rounded-2xl bg-[var(--surface-container-low)]/70 border border-white/[0.06] backdrop-blur-md p-6 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-[var(--on-surface)] flex items-center gap-2">
                <Radio className="w-5 h-5 text-[var(--primary)]" />
                Live Molecular Fingerprint
              </h3>
              <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase">
                EPA CONTINUOUS GROUND SENSORS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* PM2.5 */}
              <div className="p-4 rounded-xl bg-[var(--surface-container)]/80 border border-white/[0.04] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--primary)] font-bold">
                    PM 2.5 (FINE)
                  </span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                    WHO Tier 1
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-bold text-[var(--on-surface)]">
                    {selectedLoc.pm25}
                  </span>
                  <span className="font-mono text-xs text-[var(--on-surface-variant)]">µg/m³</span>
                </div>
                <div className="w-full bg-[var(--surface-container-highest)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--primary)] h-full rounded-full transition-all duration-700"
                    style={{ width: `${(selectedLoc.pm25 / 25) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-[var(--on-surface-variant)] italic mt-1">
                  “Fresh alpine pine sensation.”
                </p>
              </div>

              {/* PM10 */}
              <div className="p-4 rounded-xl bg-[var(--surface-container)]/80 border border-white/[0.04] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--primary)] font-bold">
                    PM 10 (COARSE)
                  </span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                    Ultra Low
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-bold text-[var(--on-surface)]">
                    {selectedLoc.pm10}
                  </span>
                  <span className="font-mono text-xs text-[var(--on-surface-variant)]">µg/m³</span>
                </div>
                <div className="w-full bg-[var(--surface-container-highest)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--primary)] h-full rounded-full transition-all duration-700"
                    style={{ width: `${(selectedLoc.pm10 / 50) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-[var(--on-surface-variant)] italic mt-1">
                  “Road debris & pollen trace minimal.”
                </p>
              </div>

              {/* Ozone */}
              <div className="p-4 rounded-xl bg-[var(--surface-container)]/80 border border-white/[0.04] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--tertiary)] font-bold">
                    O₃ (GROUND OZONE)
                  </span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[var(--tertiary)]/10 text-[var(--tertiary)]">
                    Safe Ceiling
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-bold text-[var(--on-surface)]">
                    {selectedLoc.o3}
                  </span>
                  <span className="font-mono text-xs text-[var(--on-surface-variant)]">ppb</span>
                </div>
                <div className="w-full bg-[var(--surface-container-highest)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--tertiary)] h-full rounded-full transition-all duration-700"
                    style={{ width: `${(selectedLoc.o3 / 70) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-[var(--on-surface-variant)] italic mt-1">
                  “Solar reaction minimal. Zero airway tingling.”
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Dark Neon Map & Personal Exposure Ledger (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Interactive Stylized Micro-Map Preview */}
          <div className="relative rounded-2xl bg-[var(--surface-container-low)]/90 border border-white/[0.08] backdrop-blur-xl p-5 shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
                <h3 className="font-heading text-base font-semibold text-[var(--on-surface)]">
                  Live Neighborhood Micro-Grid
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-[var(--surface-container-high)] px-2.5 py-1 rounded-full text-xs font-mono text-[var(--primary)] border border-white/[0.04]">
                <Radar className="w-3.5 h-3.5" />
                <span>VECTOR MODE</span>
              </div>
            </div>

            {/* Stylized Dark Grid Map Area */}
            <div className="relative w-full h-72 rounded-xl overflow-hidden bg-[var(--surface-container-lowest)] border border-white/[0.06] flex items-center justify-center">
              {/* Radar Grid Circles */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full border border-[var(--primary)]/20 animate-pulse" />
                <div className="w-32 h-32 rounded-full border border-[var(--primary)]/30 absolute" />
                <div className="w-64 h-64 rounded-full border border-white/[0.05] absolute" />
              </div>

              {/* Glowing Clean Air Plume */}
              <div className="absolute w-40 h-40 rounded-full bg-[var(--primary)]/20 blur-3xl pointer-events-none" />

              {/* Station Pins */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                <div className="px-3 py-1 rounded-full bg-[var(--primary)] text-[var(--on-primary-container)] font-mono text-[11px] font-bold shadow-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--on-primary-container)] animate-ping" />
                  <span>YOU ({selectedLoc.aqi} AQI)</span>
                </div>
              </div>

              <div className="absolute top-1/4 left-1/3 -translate-x-1/2 flex flex-col items-center">
                <div className="px-2 py-0.5 rounded bg-[var(--surface-container-highest)]/90 text-[var(--primary)] font-mono text-[10px] border border-white/[0.06]">
                  Greenpoint: 41
                </div>
              </div>

              <div className="absolute bottom-1/4 left-1/4 flex flex-col items-center">
                <div className="px-2 py-0.5 rounded bg-[var(--surface-container-highest)]/90 text-[var(--primary)] font-mono text-[10px] border border-white/[0.06]">
                  Navy Yard: 36
                </div>
              </div>

              <div className="absolute top-2/3 right-1/4 flex flex-col items-center">
                <div className="px-2 py-0.5 rounded bg-[var(--surface-container-highest)]/90 text-[var(--secondary)] font-mono text-[10px] border border-white/[0.06]">
                  Bushwick: 48
                </div>
              </div>

              {/* Wind Vector HUD Marker */}
              <div className="absolute bottom-3 left-3 bg-[var(--surface-container-lowest)]/85 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-[10px] text-[var(--on-surface)] border border-white/[0.06]">
                <Wind className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>WIND 9 MPH WSW</span>
              </div>

              <div className="absolute top-3 right-3 bg-[var(--surface-container-lowest)]/85 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1.5 font-mono text-[10px] text-[var(--primary)] border border-white/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-ping" />
                <span>SENTINEL-5P: LIVE</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[var(--on-surface-variant)] font-mono text-[11px]">
              <span>Sensors synced: 14 Micro-nodes</span>
              <Link
                href="/hotspots"
                className="text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                Full Satellite Radar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Exposure Score & Streak */}
          <div className="rounded-2xl bg-[var(--surface-container-low)]/90 border border-white/[0.08] backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--secondary-container)]/30 text-[var(--secondary)] flex items-center justify-center font-bold text-sm">
                  🔥
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase block">
                    DAILY BIOLOGICAL LOAD
                  </span>
                  <h4 className="font-heading text-base font-bold text-[var(--on-surface)]">
                    Your Exposure Score Today
                  </h4>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-mono text-[11px] font-bold border border-[var(--primary)]/20">
                CLEAN STREAK: 4 DAYS
              </div>
            </div>

            {/* Score Progression */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-3xl font-bold text-[var(--primary)]">12</span>
                  <span className="text-sm text-[var(--on-surface-variant)]">/ 100</span>
                </div>
                <span className="font-mono text-[10px] text-[var(--primary)]">
                  VERY LOW (TOP 5% OF NYC)
                </span>
              </div>
              <div className="w-full bg-[var(--surface-container-highest)] h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-[var(--primary)] h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(78,222,163,0.8)]"
                  style={{ width: "12%" }}
                />
              </div>
            </div>

            <p className="text-xs text-[var(--on-surface-variant)]">
              By avoiding the BQE expressway corridor during 8am rush hour, you dodged an estimated{" "}
              <strong className="text-[var(--on-surface)]">14.6 µg</strong> of inhaled black carbon.
            </p>

            <Link
              href="/exposure"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-medium text-xs shadow-lg hover:brightness-105 transition-all font-mono"
            >
              <span>Deep Dive My Exposure Dose</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Community Pulse Card */}
          <div className="rounded-2xl bg-[var(--surface-container-low)]/70 border border-white/[0.06] backdrop-blur-md p-4 shadow-md flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[var(--surface-container-high)] border border-white/[0.08] flex items-center justify-center text-2xl shrink-0">
              🛹
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--primary)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>COMMUNITY VERDICT</span>
              </div>
              <p className="text-sm font-semibold text-[var(--on-surface)] truncate">
                McCarren Track & Domino Lawn packed
              </p>
              <p className="text-xs text-[var(--on-surface-variant)] truncate">
                342 runners tagged this air shed as "Pure Butter" this hour.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Predictive Breath Forecast Strip */}
      <section className="w-full rounded-2xl bg-[var(--surface-container-low)]/80 border border-white/[0.08] backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono text-xs text-[var(--primary)] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              AI ATMOSPHERIC PROJECTION
            </span>
            <h3 className="font-heading text-lg font-bold text-[var(--on-surface)]">
              Next 24 Hours: When to Step Outside
            </h3>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-[var(--on-surface-variant)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)]" /> Ideal Workout
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--secondary)]" /> Rush Inversion
            </span>
          </div>
        </div>

        {/* Hourly Cards Horizontal Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          {FORECAST_HOURLY.map((item) => (
            <div
              key={item.time}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border text-center transition-all",
                item.highlight
                  ? "bg-[var(--primary)]/15 border-[var(--primary)]/40 shadow-sm"
                  : "bg-[var(--surface-container)]/60 border-white/[0.04] hover:bg-[var(--surface-container)]"
              )}
            >
              <span
                className={cn(
                  "font-mono text-[10px]",
                  item.highlight ? "text-[var(--primary)] font-bold" : "text-[var(--on-surface-variant)]"
                )}
              >
                {item.time}
              </span>
              <span
                className={cn(
                  "font-mono text-xl font-bold my-1",
                  item.highlight ? "text-[var(--primary)]" : "text-[var(--on-surface)]"
                )}
              >
                {item.aqi}
              </span>
              <span className="text-sm">{item.icon}</span>
              <span className="font-mono text-[10px] text-[var(--on-surface)] mt-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
