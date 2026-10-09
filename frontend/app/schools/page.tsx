"use client";

import { useState } from "react";
import {
  Building2,
  ChevronDown,
  ShieldCheck,
  CheckCircle,
  Clock,
  Send,
  FileText,
  Phone,
  Users,
  AlertCircle,
  Activity,
  Wind,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CampusOption {
  name: string;
  subType: string;
  aqi: number;
  pm25: number;
}

const CAMPUSES: CampusOption[] = [
  {
    name: "NYU Downtown Campus & Athletic Complex",
    subType: "Collegiate NCAA / Urban Core",
    aqi: 32,
    pm25: 6.4,
  },
  {
    name: "St. Jude Early Elementary Academy",
    subType: "Pre-K & Grades 1-5 / Courtyard Hub",
    aqi: 28,
    pm25: 5.2,
  },
  {
    name: "Midwood Regional High School",
    subType: "Grades 9-12 Interscholastic Athletics",
    aqi: 35,
    pm25: 7.1,
  },
];

type AgeBand = "elementary" | "highschool" | "ncaa";

export default function SchoolsPage() {
  const [selectedCampus, setSelectedCampus] = useState<CampusOption>(CAMPUSES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ageBand, setAgeBand] = useState<AgeBand>("highschool");
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [draftMessage, setDraftMessage] = useState(
    `Daily Air Clearance for ${selectedCampus.name}: Today is a Green Air Day (AQI ${selectedCampus.aqi}). Outdoor PE, recess, and athletics are fully approved as scheduled.`
  );

  const handleCampusSelect = (camp: CampusOption) => {
    setSelectedCampus(camp);
    setDropdownOpen(false);
    setDraftMessage(
      `Daily Air Clearance for ${camp.name}: Today is a Green Air Day (AQI ${camp.aqi}). Outdoor PE, recess, and athletics are fully approved as scheduled.`
    );
  };

  const handleBroadcast = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setBroadcastSent(true);
      setTimeout(() => setBroadcastSent(false), 3500);
    }, 900);
  };

  return (
    <div className="relative w-full overflow-hidden px-6 md:px-12 py-8 flex flex-col gap-8">
      {/* Background glow anchors */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--primary)]/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-[var(--tertiary)]/10 blur-[100px] pointer-events-none -z-10" />

      {/* Top Institutional Band */}
      <div className="relative rounded-2xl bg-[var(--surface-container)]/90 border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--primary-container)] to-[var(--tertiary)]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[10px] text-[var(--primary)] px-2.5 py-0.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/20">
                GOVERNANCE ACTIVE • EP-PROTOCOL 4.2
              </span>
              <span className="font-mono text-[10px] text-[var(--on-surface-variant)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
                EPA Continuous School Air Standard v2
              </span>
            </div>

            {/* Campus selector dropdown */}
            <div className="relative mt-1">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] border border-white/[0.06] transition-all px-4 py-2.5 rounded-xl text-left cursor-pointer shadow-sm"
              >
                <Building2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
                <div>
                  <div className="font-mono text-[9px] text-[var(--on-surface-variant)] uppercase tracking-wider">
                    Active Sector
                  </div>
                  <div className="font-heading text-base font-bold text-[var(--on-surface)] flex items-center gap-2">
                    <span>{selectedCampus.name}</span>
                    <ChevronDown className="w-4 h-4 text-[var(--on-surface-variant)]" />
                  </div>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-[var(--surface-container-highest)]/95 backdrop-blur-2xl border border-white/[0.1] rounded-xl p-2 shadow-2xl z-40">
                  {CAMPUSES.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => handleCampusSelect(c)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between text-xs",
                        selectedCampus.name === c.name
                          ? "bg-[var(--primary-container)]/20 text-[var(--primary)] font-semibold"
                          : "hover:bg-white/[0.05] text-[var(--on-surface)]"
                      )}
                    >
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="font-mono text-[10px] text-[var(--on-surface-variant)]">
                          {c.subType}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--primary)]">
                        AQI {c.aqi}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Verdict Pill Banner */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-lg shadow-[var(--primary)]/15">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--on-primary-container)] opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[var(--on-primary-container)]" />
              </span>
              <div>
                <div className="font-mono text-[9px] opacity-80 uppercase tracking-widest font-bold">
                  Protocol Verdict
                </div>
                <div className="font-heading text-sm font-bold">
                  ALL OUTDOOR ACTIVITIES CLEARED
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--surface-container-low)] border border-white/[0.06] font-mono text-xs">
              <div className="text-right">
                <div className="text-[var(--on-surface-variant)] text-[10px]">WHO Index</div>
                <div className="text-[var(--primary)] font-bold">Tier 1 Safe</div>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div>
                <div className="text-[var(--on-surface-variant)] text-[10px]">Thermal Stress</div>
                <div className="text-[var(--on-surface)] font-semibold">WBGT Low</div>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Ribbon */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-[var(--on-surface-variant)]">CAMPUS SENSOR:</span>
              <strong className="text-[var(--primary)] font-bold">AQI {selectedCampus.aqi}</strong>
            </div>
            <span className="text-[var(--outline-variant)]">•</span>
            <div>
              <span className="text-[var(--on-surface-variant)]">PM2.5: </span>
              <strong className="text-[var(--on-surface)]">{selectedCampus.pm25} µg/m³</strong>
            </div>
            <span className="text-[var(--outline-variant)]">•</span>
            <div>
              <span className="text-[var(--on-surface-variant)]">TEMP: </span>
              <strong className="text-[var(--on-surface)]">71°F</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[var(--on-surface-variant)] text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span>Roof Array Array B-4 Validated</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Architectural Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Rule-Based Activity Matrix (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-container-low)] border border-white/[0.06] p-4 rounded-xl">
            <div>
              <div className="font-heading text-sm font-bold text-[var(--on-surface)]">
                Outdoor Activity Protocol Matrix
              </div>
              <p className="text-xs text-[var(--on-surface-variant)]">
                Rule-enforced authorization levels based on microclimate readings.
              </p>
            </div>

            {/* Policy Threshold Switcher */}
            <div className="flex items-center bg-[var(--surface-container-highest)] p-1 rounded-full gap-1 text-xs font-mono">
              {[
                { id: "elementary", label: "Early Elementary" },
                { id: "highschool", label: "High School" },
                { id: "ncaa", label: "Collegiate NCAA" },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setAgeBand(b.id as AgeBand)}
                  className={cn(
                    "px-3 py-1 rounded-full transition-all cursor-pointer",
                    ageBand === b.id
                      ? "bg-[var(--primary)] text-[var(--on-primary-container)] font-semibold shadow-sm"
                      : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Protocol Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Recess */}
            <div className="relative rounded-2xl bg-[var(--surface-container)]/70 border border-white/[0.06] p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--primary)] font-bold">
                    K-12 CASUAL PLAY
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-mono text-[9px] font-bold">
                    UNRESTRICTED
                  </span>
                </div>
                <h4 className="font-heading text-sm font-bold text-[var(--on-surface)]">
                  Recess & Courtyard Break
                </h4>
                <p className="text-xs text-[var(--on-surface-variant)]">
                  {ageBand === "elementary"
                    ? "Early Elementary Protocol: Max continuous outdoor play 90m per session. Hydration checkpoints advised."
                    : "Safe for student cohorts. Maximum duration: Unlimited under current ambient particulate density."}
                </p>
              </div>
              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between font-mono text-[10px]">
                <span className="text-[var(--on-surface-variant)]">Gate: PM2.5 &lt; 35</span>
                <span className="text-[var(--primary)] font-bold">PASS ({selectedCampus.pm25} µg/m³)</span>
              </div>
            </div>

            {/* Card 2: Athletics */}
            <div className="relative rounded-2xl bg-[var(--surface-container)]/70 border border-white/[0.06] p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--primary)] font-bold">
                    ENDURANCE & VARSITY
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-mono text-[9px] font-bold">
                    FULL CLEARANCE
                  </span>
                </div>
                <h4 className="font-heading text-sm font-bold text-[var(--on-surface)]">
                  High-Intensity Athletics
                </h4>
                <p className="text-xs text-[var(--on-surface-variant)]">
                  {ageBand === "ncaa"
                    ? "NCAA Division 1 Competition Standard: Unconstrained practice duration. Elite metabolic intake rates cleared."
                    : "Cross-country running, soccer scrimmage, and conditioning approved. Pulmonary threshold below fatigue limit."}
                </p>
              </div>
              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between font-mono text-[10px]">
                <span className="text-[var(--on-surface-variant)]">Inhalation Max: &lt; 180 L/hr</span>
                <span className="text-[var(--primary)] font-bold">PASS (Normal Reserve)</span>
              </div>
            </div>

            {/* Card 3: Asthmatic Groups */}
            <div className="relative rounded-2xl bg-[var(--surface-container)]/70 border border-white/[0.06] p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--primary)] font-bold">
                    HEALTH CARE PROTOCOL
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-mono text-[9px] font-bold">
                    SAFE PROFILE
                  </span>
                </div>
                <h4 className="font-heading text-sm font-bold text-[var(--on-surface)]">
                  Asthmatic & Reactive Cohorts
                </h4>
                <p className="text-xs text-[var(--on-surface-variant)]">
                  No precautionary prophylactic inhaler timing needed prior to standard PE. Ground ozone is negligible (&lt; 0.021 ppm).
                </p>
              </div>
              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between font-mono text-[10px]">
                <span className="text-[var(--on-surface-variant)]">Nurse Alert: NONE</span>
                <span className="text-[var(--primary)] font-bold">CLEARED (Tier 1)</span>
              </div>
            </div>

            {/* Card 4: Bus Bay */}
            <div className="relative rounded-2xl bg-[var(--surface-container)]/70 border border-white/[0.06] p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--primary)] font-bold">
                    LOGISTICS & TRANSIT
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-mono text-[9px] font-bold">
                    OPTIMAL
                  </span>
                </div>
                <h4 className="font-heading text-sm font-bold text-[var(--on-surface)]">
                  Bus Loading & Trips
                </h4>
                <p className="text-xs text-[var(--on-surface-variant)]">
                  Idling vehicle dispersal rating is strong. Recommended bus loading zones have high lateral ventilation airflow.
                </p>
              </div>
              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between font-mono text-[10px]">
                <span className="text-[var(--on-surface-variant)]">Dispersion: 11 mph SW</span>
                <span className="text-[var(--primary)] font-bold">HIGH VENTILATION</span>
              </div>
            </div>
          </div>

          {/* Physical Campus Zones */}
          <div className="rounded-2xl bg-[var(--surface-container-low)] border border-white/[0.06] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-bold text-[var(--on-surface)]">
                Physical Campus Micro-Zones
              </span>
              <span className="font-mono text-[10px] text-[var(--primary)] px-2.5 py-0.5 rounded-full bg-[var(--primary)]/10">
                3 Live Sensors
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-[var(--surface-container)] border border-white/[0.04] p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--on-surface)]">
                    <span>Athletic Turf Stadium</span>
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                  </div>
                  <div className="font-mono text-[10px] text-[var(--on-surface-variant)] mt-0.5">
                    Sensor #NW-08 • Open Air
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between font-mono text-xs">
                  <span className="text-[var(--primary)] font-bold">AQI 34</span>
                  <span className="text-[var(--on-surface-variant)] text-[10px]">O3: 18 ppb</span>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--surface-container)] border border-white/[0.04] p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--on-surface)]">
                    <span>Central Quad Courtyard</span>
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                  </div>
                  <div className="font-mono text-[10px] text-[var(--on-surface-variant)] mt-0.5">
                    Sensor #CQ-02 • Shaded
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between font-mono text-xs">
                  <span className="text-[var(--primary)] font-bold">AQI 29</span>
                  <span className="text-[var(--on-surface-variant)] text-[10px]">PM2.5: 5.1 µg</span>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--surface-container)] border border-white/[0.04] p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--on-surface)]">
                    <span>Bus Bay & Drop-Off</span>
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                  </div>
                  <div className="font-mono text-[10px] text-[var(--on-surface-variant)] mt-0.5">
                    Sensor #BB-14 • Roadside
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between font-mono text-xs">
                  <span className="text-[var(--primary)] font-bold">AQI 38</span>
                  <span className="text-[var(--on-surface-variant)] text-[10px]">NO2: 12 ppb</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Advisory Generator & Dispatch Tools (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="relative rounded-2xl bg-[var(--surface-container)] border border-white/[0.08] p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[var(--primary)]" />
                <span className="font-mono text-xs font-bold text-[var(--on-surface)] uppercase">
                  Broadcast Dispatch
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-mono text-[10px]">
                One-Click
              </span>
            </div>

            <div>
              <h4 className="font-heading text-sm font-bold text-[var(--on-surface)]">
                Parent & Faculty Advisory
              </h4>
              <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">
                Auto-synthesized communication draft complying with district notification requirements.
              </p>
            </div>

            {/* Editable Draft */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between font-mono text-[10px] text-[var(--on-surface-variant)]">
                <span>MESSAGE TEXT</span>
                <span className="text-[var(--primary)] font-bold">{draftMessage.length} chars</span>
              </div>
              <textarea
                className="w-full bg-[var(--surface-container-lowest)] border border-white/[0.06] p-3 rounded-xl text-xs text-[var(--on-surface)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                rows={4}
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
              />
            </div>

            {/* Recipient Toggles */}
            <div className="flex flex-col gap-2 font-mono text-xs">
              <span className="text-[10px] text-[var(--on-surface-variant)]">RECIPIENTS</span>
              <label className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-container-high)]/60 text-[var(--on-surface)] cursor-pointer">
                <span className="text-[11px]">Parent SMS (3,412 active)</span>
                <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-container-high)]/60 text-[var(--on-surface)] cursor-pointer">
                <span className="text-[11px]">Coaching Staff (48 active)</span>
                <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-container-high)]/60 text-[var(--on-surface)] cursor-pointer">
                <span className="text-[11px]">Nursing Roster (14 active)</span>
                <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleBroadcast}
                disabled={sending}
                className="w-full py-3 bg-[var(--primary)] text-[var(--on-primary-container)] font-mono text-xs font-bold rounded-xl shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? "Transmitting..." : "Send Broadcast Now"}</span>
              </button>

              <button className="w-full py-2.5 bg-[var(--surface-container-high)] text-[var(--on-surface)] font-mono text-xs font-semibold rounded-xl hover:bg-[var(--surface-container-highest)] transition-all flex items-center justify-center gap-2 cursor-pointer">
                <FileText className="w-4 h-4 text-[var(--tertiary)]" />
                <span>Download Compliance PDF</span>
              </button>
            </div>

            {broadcastSent && (
              <div className="p-3 rounded-xl bg-[var(--primary)]/20 border border-[var(--primary)]/40 text-xs font-mono text-[var(--primary)] flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Dispatched to 3,474 recipients!</span>
              </div>
            )}
          </div>

          {/* Audit trail */}
          <div className="rounded-2xl bg-[var(--surface-container-low)] border border-white/[0.06] p-4 flex flex-col gap-2 font-mono text-xs">
            <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">
              District Safety Audit Trail
            </span>
            <div className="space-y-1.5">
              <div className="flex justify-between p-2 rounded bg-[var(--surface-container)] text-[11px]">
                <span>07:00 AM • Auto Clearance</span>
                <span className="text-[var(--primary)] font-bold">CLEARED</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[var(--surface-container)] text-[11px]">
                <span>11:30 AM • EPA-402 Validation</span>
                <span className="text-[var(--primary)] font-bold">CLEARED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
