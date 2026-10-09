"use client";

import { useState } from "react";
import {
  Shield,
  PlusCircle,
  Sliders,
  Wind,
  Layers,
  Trees,
  AlertTriangle,
  Lightbulb,
  Radio,
  Clock,
  Sparkles,
  CheckCircle,
  Laptop,
  Coffee,
  Activity,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  name: string;
  emoji: string;
  duration: string;
  ve: string;
  veLabel: string;
  dose: number;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: "walk",
    name: "Walking Commute",
    emoji: "🚶",
    duration: "30 min • Sidewalk path",
    ve: "18 L/min",
    veLabel: "Modest effort",
    dose: 2.1,
  },
  {
    id: "cycle",
    name: "Cycling / High Exertion",
    emoji: "🚴",
    duration: "45 min • Urban bike lane",
    ve: "45 L/min",
    veLabel: "Rapid breath",
    dose: 5.4,
  },
  {
    id: "desk",
    name: "Desk Work + HEPA",
    emoji: "💻",
    duration: "6 hours • Purified Sanctuary",
    ve: "7.5 L/min",
    veLabel: "HEPA Active",
    dose: 0.8,
  },
  {
    id: "coffee",
    name: "Coffee on Patio",
    emoji: "☕",
    duration: "20 min • Sheltered courtyard",
    ve: "8.0 L/min",
    veLabel: "Resting State",
    dose: 1.1,
  },
];

export default function ExposurePage() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem>(ACTIVITIES[0]);
  const [sessionLogged, setSessionLogged] = useState(false);

  // SVG Dial parameters for Exposure Score
  const score = 24 + Math.round(selectedActivity.dose * 2);
  const maxScore = 100;
  const circumference = 552.92; // 2 * pi * 88
  const strokeDashoffset = circumference * (1 - score / maxScore);

  return (
    <div className="relative w-full overflow-hidden px-6 md:px-12 py-8 flex flex-col gap-10">
      {/* Background Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-[var(--primary)]/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-96 right-12 w-[30rem] h-[30rem] rounded-full bg-[var(--tertiary-container)]/10 blur-[140px] pointer-events-none -z-10" />

      {/* Top Tactical Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3.5 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-mono text-[11px] font-semibold flex items-center gap-1.5 border border-[var(--primary)]/20">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
              PERSONAL DOSIMETRY HUB • TELEMETRY ACTIVE
            </span>
            <span className="px-3.5 py-1 rounded-full bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] font-mono text-[11px] border border-white/[0.04]">
              SYNCED WITH HEALTH DATA • VE-RATE: AUTO
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--on-surface)] tracking-tight">
            My Inhaled Dose <span className="text-[var(--primary)] font-light">Ledger</span>
          </h1>
          <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
            Live volumetric calculation of micro-particulate mass (PM2.5) deposited in your respiratory tract, calibrated to minute-by-minute exertion levels and spatial pollution density.
          </p>
        </div>

        {/* Gamified Streak Counter & Quick Action */}
        <div className="flex items-center gap-4 shrink-0 flex-wrap">
          <div className="bg-[var(--surface-container-low)]/90 border border-white/[0.08] backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-container-high)] flex items-center justify-center text-2xl shadow-inner border border-white/[0.06]">
              🛡️
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-heading text-base font-bold text-[var(--on-surface)]">
                  Air Guardian
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[var(--primary)] text-[var(--on-primary-container)] font-mono text-[10px] font-bold uppercase">
                  Tier 3
                </span>
              </div>
              <span className="font-mono text-xs text-[var(--primary)]">
                6-day low pollution streak (+420 XP)
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setSessionLogged(true);
              setTimeout(() => setSessionLogged(false), 2500);
            }}
            className="px-5 py-3 rounded-xl bg-[var(--primary)] hover:brightness-105 text-[var(--on-primary-container)] font-semibold text-xs font-mono flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{sessionLogged ? "Session Logged! ✓" : "Log Outdoor Session"}</span>
          </button>
        </div>
      </div>

      {/* Bento Grid 1: Hero Exposure Dial + Biometric Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Dial Hero Card (5 Cols) */}
        <div className="lg:col-span-5 bg-[var(--surface-container-low)]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider block">
                Realtime Metric
              </span>
              <h2 className="font-heading text-xl font-bold text-[var(--on-surface)]">
                Daily Inhaled Dose
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[var(--surface-container)] text-[var(--primary)] font-mono text-[10px] border border-white/[0.06]">
              PID INDEX
            </span>
          </div>

          {/* Circular Radial Progress Graphic */}
          <div className="relative my-6 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 220 220">
                <circle
                  className="text-[var(--surface-container-highest)]/40"
                  cx="110"
                  cy="110"
                  fill="none"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="14"
                />
                <circle
                  className="text-[var(--primary)] transition-all duration-1000 ease-out"
                  cx="110"
                  cy="110"
                  fill="none"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="14"
                  strokeDasharray="552.92"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase">
                  Exposure Load
                </span>
                <div className="flex items-baseline gap-1 my-0.5">
                  <span className="font-mono text-5xl font-bold text-[var(--on-surface)] tracking-tight">
                    {score}
                  </span>
                  <span className="font-mono text-lg text-[var(--outline)]">/100</span>
                </div>
                <span className="px-3 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-mono text-[10px] font-semibold uppercase mt-1">
                  Minimal Inhaled Burden
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
              <span className="text-[var(--on-surface-variant)]">
                Budget: <strong className="text-[var(--on-surface)]">{100 - score}% capacity left</strong>
              </span>
            </div>
            <span className="text-[var(--primary)] font-semibold">ICRP Calibrated</span>
          </div>
        </div>

        {/* Right Side: Key Inhaled PM2.5 Biomarker Ledger (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Large Inhalation Mass Banner Card */}
          <div className="bg-[var(--surface-container-low)]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">
                Estimated Particulate Mass Intake
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl sm:text-5xl font-bold text-[var(--primary)]">
                  {(4.8 + selectedActivity.dose).toFixed(1)}
                </span>
                <span className="font-heading text-lg font-medium text-[var(--on-surface)]">
                  µg PM2.5
                </span>
              </div>
              <p className="text-xs text-[var(--on-surface-variant)] max-w-md mt-1">
                WHO safe daily ceiling is <strong className="text-[var(--on-surface)]">&lt;25.0 µg</strong>. You are operating at an optimal{" "}
                <span className="text-[var(--primary)] font-semibold">
                  {(((4.8 + selectedActivity.dose) / 25) * 100).toFixed(1)}%
                </span>{" "}
                of cumulative health limit.
              </p>
            </div>

            {/* Visual Bar Gauge */}
            <div className="w-full md:w-64 bg-[var(--surface-container-high)] border border-white/[0.06] p-4 rounded-xl flex flex-col gap-2 shrink-0">
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="text-[var(--on-surface)]">TODAY'S USAGE</span>
                <span className="text-[var(--primary)] font-bold">
                  {(4.8 + selectedActivity.dose).toFixed(1)} / 25 µg
                </span>
              </div>
              <div className="w-full h-2.5 bg-[var(--surface-container-highest)] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-700"
                  style={{ width: `${((4.8 + selectedActivity.dose) / 25) * 100}%` }}
                />
              </div>
              <div className="flex justify-between font-mono text-[9px] text-[var(--outline)]">
                <span>0 µg</span>
                <span className="text-[var(--secondary)]">Caution 15</span>
                <span className="text-[var(--destructive)]">Ceiling 25</span>
              </div>
            </div>
          </div>

          {/* Micro Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--surface-container-low)]/80 border border-white/[0.06] backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--on-surface-variant)]">
                <span className="font-mono text-[10px] uppercase">Minute Ventilation</span>
                <Wind className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="my-2">
                <span className="font-mono text-2xl font-bold text-[var(--on-surface)]">14.2</span>
                <span className="font-mono text-[11px] text-[var(--outline)] ml-1">L/min avg</span>
              </div>
              <span className="text-xs text-[var(--on-surface-variant)]">
                Sedentary baseline + 25m walk spike
              </span>
            </div>

            <div className="bg-[var(--surface-container-low)]/80 border border-white/[0.06] backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--on-surface-variant)]">
                <span className="font-mono text-[10px] uppercase">Deep Alveolar Rate</span>
                <Layers className="w-4 h-4 text-[var(--tertiary)]" />
              </div>
              <div className="my-2">
                <span className="font-mono text-2xl font-bold text-[var(--on-surface)]">64.1%</span>
                <span className="font-mono text-[11px] text-[var(--primary)] ml-1">Filtered</span>
              </div>
              <span className="text-xs text-[var(--on-surface-variant)]">
                Nasopharyngeal capture active
              </span>
            </div>

            <div className="bg-[var(--surface-container-low)]/80 border border-white/[0.06] backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--on-surface-variant)]">
                <span className="font-mono text-[10px] uppercase">Clean Air Equiv.</span>
                <Trees className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="my-2">
                <span className="font-mono text-2xl font-bold text-[var(--primary)]">+5.2</span>
                <span className="font-mono text-[11px] text-[var(--outline)] ml-1">Hours</span>
              </div>
              <span className="text-xs text-[var(--on-surface-variant)]">
                Clean air gained vs city ambient avg
              </span>
            </div>
          </div>

          {/* Quick Recommendation Pill */}
          <div className="bg-[var(--surface-container-high)]/60 border border-white/[0.06] backdrop-blur-md rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <p className="text-xs text-[var(--on-surface)] truncate">
                <strong className="text-[var(--primary)]">Clean Lung Window:</strong> Current respiration load is 34% lower than last Tuesday. Perfect time for evening conditioning outdoors!
              </p>
            </div>
            <span className="font-mono text-[10px] text-[var(--on-surface-variant)] shrink-0">
              RECOMMENDED
            </span>
          </div>
        </div>
      </div>

      {/* 24-Hour Timeline & Risk Windows Forecast */}
      <div className="bg-[var(--surface-container-low)]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl font-bold text-[var(--on-surface)]">
                24-Hour Inhalation Dynamics & Risk Windows
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] text-[var(--tertiary)] font-mono text-[10px]">
                FORECAST v2.4
              </span>
            </div>
            <p className="text-xs text-[var(--on-surface-variant)] mt-1">
              Cross-referencing your biometric schedule against municipal expressway traffic sensors and meteorological inversions.
            </p>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-[var(--on-surface-variant)] flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" /> Emerald Clean (Safe)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--secondary)]" /> Amber Rush (Cautious)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--tertiary)]" /> Evening Stagnation
            </span>
          </div>
        </div>

        {/* Interactive SVG Chart of 24h Burden */}
        <div className="w-full bg-[var(--surface-container-lowest)]/80 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between font-mono text-[10px] text-[var(--outline)]">
            <span>00:00 (MIDNIGHT)</span>
            <span>06:00</span>
            <span className="text-[var(--secondary)] font-bold">08:30 MORNING SPIKE</span>
            <span className="text-[var(--primary)] font-bold">13:00 MIDDAY OPTIMAL</span>
            <span className="text-[var(--tertiary)] font-bold">19:30 EVENING STAGNATION</span>
            <span>23:59</span>
          </div>

          <div className="w-full h-44 relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
              <defs>
                <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#ffb2b7" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4edea3" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#4edea3" />
                  <stop offset="30%" stopColor="#ffb2b7" />
                  <stop offset="50%" stopColor="#4edea3" />
                  <stop offset="85%" stopColor="#d0bcff" />
                  <stop offset="100%" stopColor="#4edea3" />
                </linearGradient>
              </defs>

              <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" x1="0" x2="1000" y1="50" y2="50" />
              <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" x1="0" x2="1000" y1="100" y2="100" />
              <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" x1="0" x2="1000" y1="150" y2="150" />

              {/* Area Fill */}
              <path
                d="M 0 160 Q 150 160, 250 170 T 330 65 T 400 70 T 520 165 T 700 160 T 820 110 T 910 115 T 1000 155 L 1000 200 L 0 200 Z"
                fill="url(#areaGrad)"
              />
              {/* Dynamic Line */}
              <path
                d="M 0 160 Q 150 160, 250 170 T 330 65 T 400 70 T 520 165 T 700 160 T 820 110 T 910 115 T 1000 155"
                fill="none"
                stroke="url(#lineGrad)"
                strokeLinecap="round"
                strokeWidth="3.5"
              />

              {/* Peak Risk Events */}
              <circle cx="350" cy="65" fill="#67001b" r="6" stroke="#ffb2b7" strokeWidth="2" />
              <circle cx="600" cy="162" fill="#003824" r="6" stroke="#4edea3" strokeWidth="2" />
              <circle cx="850" cy="112" fill="#3c0091" r="6" stroke="#d0bcff" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Smart Advisory Alert Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--secondary-container)]/30 via-[var(--surface-container-high)] to-[var(--surface-container-high)] border border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--secondary-container)] flex items-center justify-center shrink-0 shadow-md text-xl">
              ⚠️
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--secondary)] text-[var(--on-secondary)] font-bold uppercase">
                  Proactive Smart Alert
                </span>
                <span className="font-mono text-[10px] text-[var(--on-surface-variant)]">
                  • Atmospheric Physics Model
                </span>
              </div>
              <h3 className="font-heading text-base font-bold text-[var(--on-surface)]">
                Peak Smog Window: Tomorrow 8:15 AM – 9:30 AM
              </h3>
              <p className="text-xs text-[var(--on-surface-variant)]">
                Ground-level temperature inversion will trap localized diesel particulates along your transit corridor.{" "}
                <span className="text-[var(--primary)] font-semibold">Shift morning jog to 7:00 AM</span> to avoid +3.4 µg excess burden.
              </p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--on-primary-container)] font-mono text-xs font-semibold shrink-0 cursor-pointer">
            Auto-Shift Run Alarm
          </button>
        </div>
      </div>

      {/* Interactive Activity Selector & Dose Simulator */}
      <div className="bg-[var(--surface-container-low)]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-[var(--primary)] uppercase tracking-wider">
              Predictive Modeling Engine
            </span>
            <h2 className="font-heading text-xl font-bold text-[var(--on-surface)]">
              Interactive Activity Selector & Dose Simulator
            </h2>
            <p className="text-xs text-[var(--on-surface-variant)] mt-1 max-w-2xl">
              Select an upcoming daily block. The calculator combines your projected minute ventilation rate (tidal volume × cadence) with hyper-local environmental density.
            </p>
          </div>

          <div className="bg-[var(--surface-container-high)] border border-white/[0.06] px-5 py-2.5 rounded-xl flex items-center gap-3 shrink-0">
            <span className="font-mono text-[10px] text-[var(--on-surface-variant)]">
              SIMULATED EXTRA DOSE:
            </span>
            <span className="font-mono text-lg text-[var(--primary)] font-bold">
              +{selectedActivity.dose.toFixed(1)} µg
            </span>
          </div>
        </div>

        {/* 4 Activity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACTIVITIES.map((act) => {
            const isSelected = selectedActivity.id === act.id;
            return (
              <button
                key={act.id}
                onClick={() => setSelectedActivity(act)}
                className={cn(
                  "text-left rounded-2xl p-5 flex flex-col justify-between gap-4 border transition-all cursor-pointer",
                  isSelected
                    ? "bg-[var(--surface-container-high)] border-[var(--primary)] ring-2 ring-[var(--primary)] shadow-lg"
                    : "bg-[var(--surface-container)]/60 border-white/[0.06] hover:bg-[var(--surface-container-high)]"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-container)] border border-white/[0.04] flex items-center justify-center text-2xl">
                    {act.emoji}
                  </div>
                  <span
                    className={cn(
                      "font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                      isSelected
                        ? "bg-[var(--primary)] text-[var(--on-primary-container)]"
                        : "bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)]"
                    )}
                  >
                    {isSelected ? "Simulating" : "Idle"}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading text-sm font-bold text-[var(--on-surface)]">
                    {act.name}
                  </h3>
                  <p className="text-xs text-[var(--on-surface-variant)] mt-1">{act.duration}</p>
                  <div className="flex items-center gap-2 mt-2 text-[var(--outline)] font-mono text-[10px]">
                    <span>VE: {act.ve}</span>
                    <span>•</span>
                    <span>{act.veLabel}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.04] flex items-baseline justify-between font-mono text-xs">
                  <span className="text-[var(--on-surface-variant)] text-[10px]">IMPACT</span>
                  <span className="text-[var(--primary)] font-bold">+{act.dose} µg</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Formula Footer */}
        <div className="p-4 rounded-xl bg-[var(--surface-container-high)]/40 border border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[var(--on-surface-variant)] font-mono">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            <span>
              Formula: <code className="text-[var(--primary)]">Dose (µg) = PM2.5 × VE × Time × 0.72</code>
            </span>
          </div>
          <span className="text-[var(--outline)] text-[10px]">CALIBRATED TO CLINICAL ICRP STANDARDS</span>
        </div>
      </div>

      {/* Indoor vs Outdoor Sensor Differential */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 bg-[var(--surface-container-low)]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between gap-6">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <span className="font-mono text-xs text-[var(--primary)] uppercase">
                Habitat Sanctuary Metrics
              </span>
              <h2 className="font-heading text-xl font-bold text-[var(--on-surface)] mt-1">
                Indoor vs. Outdoor Sensor Differential
              </h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-container-high)] border border-white/[0.06] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping" />
              <span>LEVOIT CORE 400S LINKED</span>
            </div>
          </div>

          {/* Dual Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outside */}
            <div className="bg-[var(--surface-container-high)]/70 border border-white/[0.06] rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--on-surface-variant)]">
                <span className="font-mono text-[10px] uppercase flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-[var(--secondary)]" />
                  Outside Ambient Air
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--secondary-container)]/60 text-[var(--secondary-coral)] font-mono text-[10px]">
                  Moderate
                </span>
              </div>
              <div className="my-4 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-bold text-[var(--on-surface)]">28</span>
                <span className="text-sm text-[var(--on-surface-variant)]">µg/m³</span>
              </div>
              <div className="flex flex-col gap-1 text-[11px] font-mono text-[var(--on-surface-variant)]">
                <div className="flex justify-between">
                  <span>Microclimate Sensor</span>
                  <span className="text-[var(--on-surface)]">EPA-402 (0.4 mi)</span>
                </div>
                <div className="flex justify-between">
                  <span>Dominant Influx</span>
                  <span className="text-[var(--secondary)]">Combustion soot</span>
                </div>
              </div>
            </div>

            {/* Inside */}
            <div className="bg-[var(--surface-container-high)]/90 border border-[var(--primary)]/40 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--primary)]">
                <span className="font-mono text-[10px] uppercase font-bold flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-[var(--primary)]" />
                  Home / Living Studio
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--primary)] text-[var(--on-primary-container)] font-mono text-[10px] font-bold">
                  92% Efficacy 🟢
                </span>
              </div>
              <div className="my-4 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-bold text-[var(--primary)]">4</span>
                <span className="text-sm text-[var(--on-surface-variant)]">µg/m³</span>
              </div>
              <div className="flex flex-col gap-1 text-[11px] font-mono text-[var(--on-surface-variant)]">
                <div className="flex justify-between">
                  <span>Active Purifier</span>
                  <span className="text-[var(--primary)] font-bold">Levoit Core 400s</span>
                </div>
                <div className="flex justify-between">
                  <span>Filtration</span>
                  <span className="text-[var(--on-surface)]">H13 True HEPA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-container)] border border-white/[0.04] flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-[var(--primary)] shrink-0" />
            <p className="text-xs text-[var(--on-surface)]">
              <strong className="text-[var(--primary)]">Sanctuary Quick Tip:</strong> Keep bedroom purifier on{" "}
              <strong className="text-[var(--on-surface)] underline decoration-[var(--primary)]">Speed 2</strong> while sleeping to maintain sub-5 µg/m³ alveolar resting exposure.
            </p>
          </div>
        </div>

        {/* Habitat Status Card (4 Cols) */}
        <div className="lg:col-span-4 bg-[var(--surface-container-low)]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-4">
          <div className="w-full h-44 rounded-xl bg-[var(--surface-container-high)] border border-white/[0.06] flex flex-col justify-between p-4">
            <span className="px-3 py-1 rounded-full bg-[var(--surface-dim)]/80 backdrop-blur-md text-[var(--primary)] font-mono text-[10px] self-start border border-[var(--primary)]/30">
              BEDROOM HEPA SANCTUARY
            </span>
            <div className="flex items-center justify-between font-mono text-xs text-[var(--on-surface)] bg-[var(--surface-dim)]/80 p-2 rounded-lg">
              <span>72°F • 44% RH</span>
              <span className="text-[var(--primary)]">Air Safe</span>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-base font-bold text-[var(--on-surface)]">
              Indoor Shield Status
            </h3>
            <p className="text-xs text-[var(--on-surface-variant)] mt-1">
              Your home envelope is successfully sealing out <strong className="text-[var(--on-surface)]">85.7%</strong> of fine particulate mass drift from adjacent Brooklyn thoroughfares.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--surface-container-high)] border border-white/[0.04] flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-[10px] text-[var(--on-surface-variant)] block">CADR RATE</span>
              <strong className="text-[var(--on-surface)]">260 CFM</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[var(--on-surface-variant)] block">FILTER LIFE</span>
              <strong className="text-[var(--primary)]">78% (142d)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
