"use client";

import { useState } from "react";
import {
  Navigation,
  CheckCircle,
  AlertTriangle,
  Scale,
  Bike,
  Footprints,
  Train,
  Sliders,
  Layers,
  Leaf,
  Wind,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RouteType = "clean" | "balanced" | "fast";
type ModeType = "walk" | "cycle" | "scooter" | "transit";

export default function RoutePage() {
  const [selectedRoute, setSelectedRoute] = useState<RouteType>("clean");
  const [selectedMode, setSelectedMode] = useState<ModeType>("cycle");
  const [origin, setOrigin] = useState("Greenpoint Loft, Brooklyn");
  const [destination, setDestination] = useState("SoHo Creative Studio, Manhattan");
  const [navigating, setNavigating] = useState(false);

  return (
    <div className="relative w-full overflow-hidden px-6 md:px-12 py-6 flex flex-col gap-8">
      {/* Top Navigation & Route Planner Ribbon */}
      <div className="relative bg-[var(--surface-container-low)] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[var(--tertiary)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Origin/Destination Inputs */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Origin */}
            <div className="flex items-center gap-3 bg-[var(--surface-container-high)]/80 border border-white/[0.06] rounded-xl px-4 py-3 shadow-inner">
              <MapPin className="w-5 h-5 text-[var(--primary)] shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-mono text-[9px] text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Origin point
                </span>
                <input
                  className="bg-transparent text-sm font-semibold text-[var(--on-surface)] focus:outline-none truncate w-full"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Choose origin..."
                />
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                AQI 38
              </span>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-3 bg-[var(--surface-container-high)]/80 border border-white/[0.06] rounded-xl px-4 py-3 shadow-inner">
              <MapPin className="w-5 h-5 text-[var(--secondary)] shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-mono text-[9px] text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Destination
                </span>
                <input
                  className="bg-transparent text-sm font-semibold text-[var(--on-surface)] focus:outline-none truncate w-full"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Choose destination..."
                />
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--secondary)]/15 text-[var(--secondary)]">
                AQI 69
              </span>
            </div>
          </div>

          {/* Mode Selector Switcher */}
          <div className="flex items-center gap-1 bg-[var(--surface-container-highest)]/60 border border-white/[0.06] p-1 rounded-full shrink-0">
            {[
              { id: "walk", label: "Walk", icon: Footprints },
              { id: "cycle", label: "Cycling", icon: Bike },
              { id: "transit", label: "Transit", icon: Train },
            ].map((m) => {
              const Icon = m.icon;
              const isActive = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id as ModeType)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer",
                    isActive
                      ? "bg-[var(--primary-container)] text-[var(--on-primary-container)] font-semibold shadow-md"
                      : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Recalculate CTA */}
          <button className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-mono text-xs font-bold shadow-lg hover:brightness-105 transition-all cursor-pointer">
            <Sliders className="w-4 h-4" />
            <span>Recalculate Lungs</span>
          </button>
        </div>

        {/* Strategy Banner */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--on-surface)]">
            <Leaf className="w-4 h-4 text-[var(--primary)] animate-pulse" />
            <span>
              Breathe Smart Strategy: Trading <strong className="text-[var(--primary)]">+6 mins</strong> avoids{" "}
              <strong className="text-[var(--primary)]">11.3 µg</strong> of PM2.5 black carbon soot today.
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--on-surface-variant)]">
            <span>ATMOSPHERE: <strong className="text-[var(--primary)]">FAVORABLE BREEZE</strong></span>
            <span>SENSORS: <strong className="text-[var(--on-surface)]">34 ACTIVE</strong></span>
          </div>
        </div>
      </div>

      {/* Route Comparison Matrix: 3 Cards Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD A: Lowest Exposure (RECOMMENDED) */}
        <div
          onClick={() => setSelectedRoute("clean")}
          className={cn(
            "cursor-pointer group relative bg-[var(--surface-container)] rounded-2xl p-6 shadow-xl transition-all border flex flex-col justify-between overflow-hidden",
            selectedRoute === "clean"
              ? "border-[var(--primary)] ring-2 ring-[var(--primary)] shadow-[0_0_32px_rgba(16,185,129,0.25)]"
              : "border-white/[0.06] hover:border-white/[0.15]"
          )}
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--primary-fixed)] to-[var(--primary)]" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-mono text-[10px] font-bold flex items-center gap-1">
                <Leaf className="w-3 h-3" /> RECOMMENDED
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-container-highest)] text-[var(--tertiary)] font-mono text-[10px]">
                Lowest Smog ✨
              </span>
            </div>

            <h3 className="font-heading text-lg font-bold text-[var(--on-surface)] flex items-center justify-between">
              <span>The Clean Green Way 🌿</span>
              {selectedRoute === "clean" && <CheckCircle className="w-5 h-5 text-[var(--primary)]" />}
            </h3>
            <p className="text-xs text-[var(--on-surface-variant)] mt-1">
              Waterfront Greenway route via East River State Park canopy
            </p>

            <div className="my-5 grid grid-cols-2 gap-3 bg-[var(--surface-container-lowest)]/80 border border-white/[0.04] rounded-xl p-4">
              <div>
                <span className="font-mono text-[10px] text-[var(--on-surface-variant)] block uppercase">
                  Travel Time
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-3xl font-bold text-[var(--on-surface)]">28</span>
                  <span className="text-xs text-[var(--on-surface-variant)]">mins</span>
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[var(--primary)] block uppercase">
                  Inhaled Dose
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-3xl font-bold text-[var(--primary)]">3.2</span>
                  <span className="text-xs text-[var(--primary)]">µg</span>
                </div>
                <span className="font-mono text-[10px] text-[var(--primary)] block mt-0.5">
                  🛡️ 64% less pollution
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[var(--on-surface)]">
              <div className="flex items-start gap-2">
                <span className="text-[var(--primary)] font-bold">✓</span>
                <span>Protected bike paths with dense green tree canopy</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--primary)] font-bold">✓</span>
                <span>East River coastal updraft continuously disperses PM2.5</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.04] flex items-center justify-between font-mono text-xs">
            <span className="text-[var(--primary)] font-semibold">Active Selection</span>
            <button className="px-3.5 py-1.5 rounded-lg bg-[var(--primary-container)] text-[var(--on-primary-container)] font-semibold">
              Select Clean
            </button>
          </div>
        </div>

        {/* CARD B: Balanced Route */}
        <div
          onClick={() => setSelectedRoute("balanced")}
          className={cn(
            "cursor-pointer group relative bg-[var(--surface-container)] rounded-2xl p-6 shadow-xl transition-all border flex flex-col justify-between overflow-hidden",
            selectedRoute === "balanced"
              ? "border-[var(--tertiary)] ring-2 ring-[var(--tertiary)] shadow-[0_0_24px_rgba(208,188,255,0.2)]"
              : "border-white/[0.06] hover:border-white/[0.15]"
          )}
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--tertiary-container)] via-[var(--tertiary)] to-[var(--tertiary)]" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--tertiary)]/15 text-[var(--tertiary)] font-mono text-[10px] flex items-center gap-1">
                <Scale className="w-3 h-3" /> BALANCED PATH
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] font-mono text-[10px]">
                Modest Compromise
              </span>
            </div>

            <h3 className="font-heading text-lg font-bold text-[var(--on-surface)] flex items-center justify-between">
              <span>Balanced Route ⚖️</span>
              {selectedRoute === "balanced" && <CheckCircle className="w-5 h-5 text-[var(--tertiary)]" />}
            </h3>
            <p className="text-xs text-[var(--on-surface-variant)] mt-1">
              Side streets & direct Williamsburg Bridge crossing
            </p>

            <div className="my-5 grid grid-cols-2 gap-3 bg-[var(--surface-container-lowest)]/80 border border-white/[0.04] rounded-xl p-4">
              <div>
                <span className="font-mono text-[10px] text-[var(--on-surface-variant)] block uppercase">
                  Travel Time
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-3xl font-bold text-[var(--on-surface)]">22</span>
                  <span className="text-xs text-[var(--on-surface-variant)]">mins</span>
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[var(--tertiary)] block uppercase">
                  Inhaled Dose
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-3xl font-bold text-[var(--tertiary)]">6.8</span>
                  <span className="text-xs text-[var(--tertiary)]">µg</span>
                </div>
                <span className="font-mono text-[10px] text-[var(--on-surface-variant)] block mt-0.5">
                  Standard City Average
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[var(--on-surface)]">
              <div className="flex items-start gap-2">
                <span className="text-[var(--tertiary)] font-bold">•</span>
                <span>Calmer residential side avenues in North Brooklyn</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--tertiary)] font-bold">•</span>
                <span>Short 5-min elevated crossing on cycle bridge</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.04] flex items-center justify-between font-mono text-xs">
            <span className="text-[var(--on-surface-variant)]">5.1 miles • +5m elev</span>
            <button className="px-3.5 py-1.5 rounded-lg bg-[var(--surface-container-high)] text-[var(--on-surface)]">
              Select Balanced
            </button>
          </div>
        </div>

        {/* CARD C: Fastest Route (High Smog Caution) */}
        <div
          onClick={() => setSelectedRoute("fast")}
          className={cn(
            "cursor-pointer group relative bg-[var(--surface-container)] rounded-2xl p-6 shadow-xl transition-all border flex flex-col justify-between overflow-hidden",
            selectedRoute === "fast"
              ? "border-[var(--secondary)] ring-2 ring-[var(--secondary)] shadow-[0_0_28px_rgba(255,180,171,0.25)]"
              : "border-white/[0.06] hover:border-white/[0.15]"
          )}
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--secondary)] via-[var(--error)] to-[var(--secondary)]" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--secondary-container)] text-[var(--on-secondary-container)] font-mono text-[10px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> HIGH SMOG CAUTION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-container-highest)] text-[var(--secondary)] font-mono text-[10px]">
                -11 mins faster
              </span>
            </div>

            <h3 className="font-heading text-lg font-bold text-[var(--on-surface)] flex items-center justify-between">
              <span>Fastest Route ⚠️</span>
              {selectedRoute === "fast" && <AlertTriangle className="w-5 h-5 text-[var(--secondary)]" />}
            </h3>
            <p className="text-xs text-[var(--on-surface-variant)] mt-1">
              Direct thoroughfare along BQE Expressway arterial
            </p>

            <div className="my-5 grid grid-cols-2 gap-3 bg-[var(--surface-container-lowest)]/80 border border-white/[0.04] rounded-xl p-4">
              <div>
                <span className="font-mono text-[10px] text-[var(--on-surface-variant)] block uppercase">
                  Travel Time
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-3xl font-bold text-[var(--on-surface)]">17</span>
                  <span className="text-xs text-[var(--on-surface-variant)]">mins</span>
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[var(--secondary)] block uppercase">
                  Inhaled Dose
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-3xl font-bold text-[var(--secondary)]">14.5</span>
                  <span className="text-xs text-[var(--secondary)]">µg</span>
                </div>
                <span className="font-mono text-[10px] text-[var(--secondary)] block mt-0.5">
                  🚨 4.5x higher soot
                </span>
              </div>
            </div>

            <div className="bg-[var(--secondary-container)]/20 border border-[var(--secondary)]/30 rounded-xl p-3 text-xs text-[var(--on-surface)]">
              Heavy diesel particulate detected along expressway corridor. N95 mask strongly advised.
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.04] flex items-center justify-between font-mono text-xs">
            <span className="text-[var(--secondary)] font-semibold">High Risk</span>
            <button className="px-3.5 py-1.5 rounded-lg bg-[var(--surface-container-high)] text-[var(--secondary)]">
              Select Despite Risk
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport Section: Interactive Map & Turn-by-Turn Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Map Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-[var(--surface-container)] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="px-6 py-3 bg-[var(--surface-container-high)]/90 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--primary)]" />
              <span className="font-heading text-sm font-semibold text-[var(--on-surface)]">
                Live Atmospheric Trajectory Overlay
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" /> Clean (Green)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--tertiary)]/20 text-[var(--tertiary)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--tertiary)]" /> Balanced (Cyan)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--secondary)]/20 text-[var(--secondary)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)] animate-pulse" /> Highway Smog (Red)
              </span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-[480px] bg-[var(--surface-container-lowest)] overflow-hidden select-none flex items-center justify-center">
            {/* Ambient Atmosphere Heatmaps */}
            <div className="absolute top-[40%] left-[45%] w-72 h-44 bg-[var(--secondary)]/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute top-[20%] left-[20%] w-80 h-72 bg-[var(--primary)]/20 rounded-full blur-3xl pointer-events-none" />

            {/* SVG Vectors for Routes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 800 520">
              {/* Grid Lines */}
              <path d="M100 0 V520 M300 0 V520 M500 0 V520 M700 0 V520" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <path d="M0 100 H800 M0 260 H800 M0 420 H800" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* ROUTE C: Fast / Red */}
              <path
                d="M120 410 Q 280 430 420 330 T 680 140"
                stroke="#ffb2b7"
                strokeWidth={selectedRoute === "fast" ? "7" : "3"}
                opacity={selectedRoute === "fast" ? "1" : "0.35"}
                strokeDasharray="8 4"
              />

              {/* ROUTE B: Balanced / Cyan */}
              <path
                d="M120 410 C 210 360, 310 260, 480 230 S 610 180, 680 140"
                stroke="#d0bcff"
                strokeWidth={selectedRoute === "balanced" ? "7" : "3"}
                opacity={selectedRoute === "balanced" ? "1" : "0.35"}
              />

              {/* ROUTE A: Clean / Emerald */}
              <path
                d="M120 410 C 160 270, 240 120, 430 110 S 590 90, 680 140"
                stroke="#4edea3"
                strokeWidth={selectedRoute === "clean" ? "8" : "3"}
                opacity={selectedRoute === "clean" ? "1" : "0.4"}
                strokeLinecap="round"
              />

              {/* Origin & Destination */}
              <circle cx="120" cy="410" fill="#10b981" r="10" />
              <circle cx="680" cy="140" fill="#d0bcff" r="10" />
            </svg>

            <div className="absolute top-4 left-4 bg-[var(--surface-container-high)]/90 backdrop-blur-md px-3 py-1.5 rounded-lg font-mono text-[10px] text-[var(--on-surface)] border border-white/[0.06]">
              🌿 GREENPOINT ORIGIN (AQI 38)
            </div>
            <div className="absolute bottom-4 right-4 bg-[var(--surface-container-high)]/90 backdrop-blur-md px-3 py-1.5 rounded-lg font-mono text-[10px] text-[var(--on-surface)] border border-white/[0.06]">
              📍 SOHO DESTINATION (AQI 69)
            </div>
          </div>

          {/* Elevation vs Smog Chart Strip */}
          <div className="p-4 bg-[var(--surface-container-low)] border-t border-white/[0.06] flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-[var(--on-surface-variant)] uppercase tracking-wider">
                Elevation vs Particulate Exposure Cross-Section
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[var(--primary)]">■ Clean Path (avg 3.2µg)</span>
                <span className="text-[var(--secondary)]">■ Highway Path (avg 14.5µg)</span>
              </div>
            </div>
            <div className="w-full h-16 relative">
              <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 600 70">
                <path d="M0 65 Q 120 40 250 55 T 450 30 T 600 45 L 600 70 L 0 70 Z" fill="rgba(78,222,163,0.12)" />
                <path d="M0 65 Q 120 40 250 55 T 450 30 T 600 45" stroke="#4edea3" strokeWidth="2.5" />
                <path d="M0 60 Q 150 50 300 15 T 480 10 T 600 40" stroke="#ffb4ab" strokeDasharray="4 2" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Atmospheric Advisory Panel (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="bg-[var(--surface-container)] border border-white/[0.08] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-heading text-base font-bold text-[var(--on-surface)]">
                Atmospheric Advisory
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-mono text-[10px]">
                Active
              </span>
            </div>
            <p className="text-xs text-[var(--on-surface-variant)]">
              Real-time micro-climate warnings along your chosen route
            </p>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-[var(--surface-container-high)]/80 border border-white/[0.04] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--primary)] font-bold">MILES 1.2 – 1.8</span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
                    AQI 22 • Pristine
                  </span>
                </div>
                <h5 className="font-heading text-xs font-bold text-[var(--on-surface)] mt-1">
                  East River Waterfront Span
                </h5>
                <p className="text-[11px] text-[var(--on-surface-variant)]">
                  Bridge crossing has clean sea breeze. Inhale deeply here — optimal zone for aerobic pace.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface-container-high)]/80 border border-white/[0.04] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--secondary)] font-bold">MILES 2.1</span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[var(--secondary-container)] text-[var(--on-secondary-container)]">
                    AQI 118 • Idling
                  </span>
                </div>
                <h5 className="font-heading text-xs font-bold text-[var(--on-surface)] mt-1">
                  Canal & Bowery Intersection
                </h5>
                <p className="text-[11px] text-[var(--on-surface-variant)]">
                  Put on mask or take Canal St bypass to avoid diesel idling. Auto-rerouted 1 block north.
                </p>
              </div>
            </div>
          </div>

          {/* Gamification Widget */}
          <div className="bg-[var(--surface-container)] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center text-2xl shrink-0">
              🏅
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[var(--primary)] font-bold uppercase">
                  Weekly Lung Shield
                </span>
                <span className="font-mono text-[10px] text-[var(--on-surface)] font-semibold">+420 XP</span>
              </div>
              <div className="font-heading text-sm font-bold text-[var(--on-surface)] mt-0.5">
                Level 7 Clean Navigator
              </div>
              <div className="w-full bg-[var(--surface-container-highest)] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[var(--primary)] h-full rounded-full w-[78%]" />
              </div>
              <span className="text-[10px] text-[var(--on-surface-variant)] block mt-1 font-mono">
                112 µg cumulative soot diverted this month!
              </span>
            </div>
          </div>

          {/* Start Navigation CTA */}
          <button
            onClick={() => {
              setNavigating(true);
              setTimeout(() => setNavigating(false), 3000);
            }}
            className="w-full py-4 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-heading text-sm font-bold flex items-center justify-center gap-2 shadow-xl hover:brightness-105 transition-all cursor-pointer font-mono"
          >
            <Navigation className="w-4 h-4" />
            <span>{navigating ? "Navigation Active in Background..." : "Start Navigation along Clean Path"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
