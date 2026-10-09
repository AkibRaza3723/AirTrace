"use client";

import { useState } from "react";
import {
  Satellite,
  Flame,
  Wind,
  Plus,
  Minus,
  MapPin,
  Camera,
  AlertTriangle,
  Users,
  ShieldCheck,
  CheckCircle2,
  X,
  UploadCloud,
  Send,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "wildfire" | "stubble" | "industrial" | "community";

export default function HotspotsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("wildfire");
  const [modalOpen, setModalOpen] = useState(false);
  const [reportType, setReportType] = useState("burning");
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleSubmitReport = () => {
    setReporting(true);
    setTimeout(() => {
      setReporting(false);
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setModalOpen(false);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="relative w-full overflow-hidden px-6 md:px-12 py-6 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--surface-container-low)]/90 border border-white/[0.08] backdrop-blur-xl shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-container-high)] text-[var(--primary)] border border-white/[0.04] text-xs font-mono">
            <Satellite className="w-4 h-4 animate-spin" />
            <span>VIIRS / NOAA-20 THERMAL PASS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-ping" />
            <span className="text-[var(--on-surface-variant)]">T-18m</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--on-primary-container)] text-[var(--primary)] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            <strong className="font-bold">LOW THREAT IN IMMEDIATE RADIUS</strong>
            <span className="text-[var(--on-surface-variant)] ml-1">Closest Hotspot 42mi N • Vector Away</span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 font-mono text-xs">
          {[
            { id: "wildfire", label: "Wildfires", icon: "🔥", count: 3 },
            { id: "stubble", label: "Agri Stubble", icon: "🌾", count: 7 },
            { id: "industrial", label: "Industrial", icon: "🏭", count: 2 },
            { id: "community", label: "Community", icon: "🚨", count: 5 },
          ].map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id as FilterType)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-[var(--secondary-container)] text-[var(--on-secondary-container)] border-[var(--secondary)] font-bold shadow-sm"
                    : "bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] border-white/[0.04] hover:text-[var(--on-surface)]"
                )}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: Radar Canvas (8) + Telemetry Feed (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Radar Map (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative w-full h-[580px] rounded-2xl overflow-hidden bg-[var(--surface-container-lowest)] border border-white/[0.08] shadow-2xl flex items-center justify-center">
            {/* Radar Grid Circles */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-[480px] h-[480px] rounded-full border border-[var(--primary)]/20 animate-pulse" />
              <div className="w-[320px] h-[320px] rounded-full border border-[var(--primary)]/30 absolute" />
              <div className="w-[160px] h-[160px] rounded-full border border-[var(--primary)]/40 absolute" />
            </div>

            {/* Plume vectors */}
            <div className="absolute top-[30%] left-[35%] w-64 h-32 bg-[var(--secondary)]/25 rounded-full blur-3xl pointer-events-none transform -rotate-12" />
            <div className="absolute top-[55%] left-[55%] w-48 h-24 bg-[var(--tertiary)]/20 rounded-full blur-2xl pointer-events-none" />

            {/* Top Overlay Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <div className="px-3.5 py-1.5 rounded-full bg-[var(--surface-container-high)]/90 backdrop-blur-md shadow-md flex items-center gap-2 text-xs font-mono text-[var(--on-surface)] border border-white/[0.06]">
                <Wind className="w-4 h-4 text-[var(--primary)]" />
                <span>WIND: 14 MPH @ 42° NE (DISPERSION VECTOR)</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-[var(--surface-container-low)]/80 backdrop-blur-md text-[11px] font-mono text-[var(--on-surface-variant)] border border-white/[0.04]">
                METRO RECEPTOR CORE: SAFE AIR COLUMN
              </div>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <div className="px-3 py-1 rounded-full bg-[var(--surface-container-low)]/90 backdrop-blur-md text-[10px] font-mono text-[var(--on-surface-variant)] border border-white/[0.06]">
                SCAN RADIUS: <strong className="text-[var(--primary)]">100 KM</strong>
              </div>
            </div>

            {/* Hotspot Pins */}
            {/* Pin 1: Wildfire */}
            <div className="group absolute top-[35%] left-[38%] -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 rounded-full bg-[var(--secondary-container)]/40 animate-ping" />
                <div className="w-5 h-5 rounded-full bg-[var(--secondary)] flex items-center justify-center shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-56 p-3 rounded-xl bg-[var(--surface-container-high)]/95 border border-white/[0.1] backdrop-blur-xl shadow-2xl">
                <span className="font-heading text-xs font-bold text-[var(--secondary)]">
                  Brush Fire (Pine Valley)
                </span>
                <span className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
                  48 MW • 42mi N • Vector Away
                </span>
              </div>
            </div>

            {/* Pin 2: Stubble */}
            <div className="group absolute top-[62%] left-[64%] -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer">
              <div className="relative flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[var(--tertiary)] flex items-center justify-center shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-52 p-3 rounded-xl bg-[var(--surface-container-high)]/95 border border-white/[0.1] backdrop-blur-xl shadow-2xl">
                <span className="font-heading text-xs font-bold text-[var(--tertiary)]">
                  Stubble Burning (Monroe)
                </span>
                <span className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
                  19 MW • Low Output
                </span>
              </div>
            </div>

            {/* Pin: User Location */}
            <div className="absolute top-[78%] left-[45%] -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-container-low)]/90 border border-white/[0.08] backdrop-blur-lg shadow-xl font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
              <span className="font-bold text-[var(--on-surface)]">YOU ARE HERE</span>
              <span className="text-[var(--primary)] text-[10px] bg-[var(--surface-dim)] px-1.5 py-0.5 rounded">
                CLEAN POCKET
              </span>
            </div>
          </div>

          {/* 3 Summary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-white/[0.06] flex flex-col justify-between">
              <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase">
                RADIATIVE POWER
              </span>
              <div className="my-2">
                <span className="font-mono text-2xl font-bold text-[var(--on-surface)]">67.2 MW</span>
                <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">-14% vs yesterday</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-white/[0.06] flex flex-col justify-between">
              <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase">
                ATMOSPHERIC INVERSION
              </span>
              <div className="my-2">
                <span className="font-mono text-2xl font-bold text-[var(--primary)]">Uncapped</span>
                <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">Vertical mixing venting</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-white/[0.06] flex flex-col justify-between">
              <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase">
                COMMUNITY SCOUTS
              </span>
              <div className="my-2">
                <span className="font-mono text-2xl font-bold text-[var(--on-surface)]">482 Online</span>
                <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">19 verifications today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Feed Sidebar (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[var(--surface-container-low)] border border-white/[0.08] shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-bold text-[var(--on-surface)]">
                Hotspot Telemetry Feed
              </span>
              <span className="font-mono text-[9px] text-[var(--on-surface-variant)] bg-[var(--surface-container-high)] px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>

            {/* Clusters */}
            <div className="p-3.5 rounded-xl bg-[var(--surface-container)] border border-white/[0.04] flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-[var(--secondary-container)] text-[var(--on-secondary-container)] font-mono text-[9px] font-bold">
                  WILDFIRE • 42mi N
                </span>
                <span className="font-mono text-[10px] text-[var(--secondary)] font-bold">21.4 µg/m³</span>
              </div>
              <h4 className="font-heading text-xs font-bold text-[var(--on-surface)] mt-1">
                Upstate Brush Fire (Pine Valley)
              </h4>
              <p className="text-[11px] text-[var(--on-surface-variant)]">
                Satellite intensity registered 48 MW. Plume venting northeast toward low density zone.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-container)] border border-white/[0.04] flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-[var(--primary)] text-[var(--on-primary-container)] font-mono text-[9px] font-bold">
                  LOCAL • 0.8mi SE
                </span>
                <span className="font-mono text-[10px] text-[var(--primary)] font-bold">Verified</span>
              </div>
              <h4 className="font-heading text-xs font-bold text-[var(--on-surface)] mt-1">
                4th Ave Excavation Silica Dust
              </h4>
              <p className="text-[11px] text-[var(--on-surface-variant)]">
                Unsuppressed excavation dust without water curtain. Triggered EPA-402 micro-spike.
              </p>
            </div>
          </div>

          {/* Citizen Radar Callout */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--surface-container-high)] via-[var(--surface-container-low)] to-[var(--surface-container-low)] border border-white/[0.08] shadow-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-[var(--primary)] text-[var(--on-primary-container)] font-mono text-[10px] font-bold">
                CITIZEN RADAR
              </span>
              <span className="font-mono text-[10px] text-[var(--tertiary)] font-bold">+150 SCOUT XP</span>
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-[var(--on-surface)]">
                Spotted unmapped smoke or dust?
              </h4>
              <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                Ground-truth our satellite sensors. Photo uploads trigger EPA validation protocols in under 12 minutes.
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="w-full py-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary-container)] font-mono text-xs font-bold flex items-center justify-center gap-2 hover:brightness-105 transition-all cursor-pointer shadow-lg mt-1"
            >
              <Camera className="w-4 h-4" />
              <span>Report Hotspot Incident</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-[var(--surface-container)] border border-white/[0.1] p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--primary)]" />
                <div>
                  <h3 className="font-heading text-base font-bold text-[var(--on-surface)]">
                    Report Air Incident
                  </h3>
                  <p className="text-xs text-[var(--on-surface-variant)]">
                    Help protect community & earn Clean Air Scout badges.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase">
                HOTSPOT TYPE
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { id: "burning", label: "Trash / Burning", icon: "🔥" },
                  { id: "construction", label: "Construction Dust", icon: "🚜" },
                  { id: "idling", label: "Vehicle Idling", icon: "🚚" },
                  { id: "odor", label: "Chemical Odor", icon: "☣️" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setReportType(t.id)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all",
                      reportType === t.id
                        ? "bg-[var(--surface-container-high)] border-[var(--primary)] text-[var(--on-surface)]"
                        : "bg-[var(--surface-container-low)] border-white/[0.04] text-[var(--on-surface-variant)]"
                    )}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload box */}
            <div className="border-2 border-dashed border-white/10 hover:border-[var(--primary)]/40 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
              <UploadCloud className="w-8 h-8 text-[var(--on-surface-variant)]" />
              <span className="text-xs font-medium text-[var(--on-surface)] mt-2">
                Click to attach ground photo
              </span>
              <span className="text-[10px] text-[var(--on-surface-variant)] mt-0.5">
                PNG, JPG up to 15MB (+double XP)
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-container-high)] text-xs font-mono text-[var(--on-surface)] cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={reporting}
                className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[var(--on-primary-container)] text-xs font-mono font-bold cursor-pointer"
              >
                {reporting ? "Transmitting..." : reportSuccess ? "Reported! ✓" : "Broadcast Intel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
