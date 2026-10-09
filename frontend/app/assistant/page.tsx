"use client";

import { useState } from "react";
import {
  Bot,
  User,
  ShieldCheck,
  Lock,
  Sparkles,
  Send,
  Mic,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ArrowUp,
  Wind,
  Check,
  Activity,
  Home,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
}

const PRESET_PROMPTS = [
  "Can I run outside for 10 miles this evening?",
  "Why is PM2.5 low but Ozone climbing at 3 PM?",
  "What HEPA purifier mode should I run in bedroom?",
  "Explain today's air quality like I am 15.",
];

export default function AssistantPage() {
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "user",
      text: "Can I run outside for 10 miles this evening? I usually hit the Brooklyn Bridge park perimeter loop.",
      time: "2m ago",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: q,
      time: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: `Based on Station EPA-402 telemetry (PM2.5: 8.1 µg/m³, AQI 34), air currents from SW are maintaining pristine condition through 5:30 PM. Your estimated alveolar burden remains well within the safe quartile!`,
        time: "Just now",
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1200);
  };

  return (
    <div className="relative w-full overflow-hidden px-6 md:px-12 py-6 flex flex-col gap-6">
      {/* Background glow backplate */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-[var(--primary)]/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-[var(--tertiary)]/10 blur-[100px] pointer-events-none -z-10" />

      {/* 1. Grounded Intelligence Header & Telemetry Trust Bar */}
      <div className="relative w-full flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-container-high)] border border-white/[0.06] flex items-center justify-center text-xl shadow-md">
              🧠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl font-bold text-[var(--on-surface)] tracking-tight">
                  BreatheWise Copilot
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-mono text-[10px] uppercase font-semibold">
                  Grounded Engine v2.4
                </span>
              </div>
              <p className="text-xs text-[var(--on-surface-variant)]">
                Live deterministic spatial intelligence & personalized respiratory assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-container)] border border-white/[0.06] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping" />
            <span className="text-[var(--on-surface-variant)]">EPA NYC Node #402 Synced</span>
            <span className="text-[var(--outline-variant)]">•</span>
            <span className="text-[var(--primary)] font-bold">0ms Drift</span>
          </div>
        </div>

        {/* Verified Grounding Banner */}
        <div className="w-full rounded-xl bg-[var(--surface-container-low)]/90 border border-white/[0.06] backdrop-blur-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-sm text-xs">
          <div className="flex items-center gap-2 text-[var(--on-surface)]">
            <ShieldCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span>
              Grounded on verified live feeds:{" "}
              <strong className="text-[var(--on-surface-variant)] font-mono">
                EPA Brooklyn 402 + NOAA HRRR Wind Model + VIIRS Satellite (14:32 UTC)
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--surface-container-highest)] font-mono text-[10px] text-[var(--primary)] font-bold">
            <Lock className="w-3 h-3" />
            <span>HALLUCINATION-PROOF</span>
          </div>
        </div>
      </div>

      {/* 2. User Persona Context & Presets */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-container-high)] border border-white/[0.06] text-xs">
            <span className="font-semibold text-[var(--on-surface)]">User: <strong className="text-[var(--primary)]">Alex</strong></span>
            <span className="text-[var(--outline-variant)]">•</span>
            <span className="text-[var(--on-surface-variant)]">Mild Asthma</span>
            <span className="text-[var(--outline-variant)]">•</span>
            <span className="text-[var(--on-surface-variant)]">E-Bike Commuter</span>
            <span className="text-[var(--outline-variant)]">•</span>
            <span className="text-[var(--on-surface-variant)]">Urban Marathoner</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[var(--on-surface-variant)]">Tone:</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--tertiary)]/15 text-[var(--tertiary)] font-bold text-[10px]">
              Athletic Coach
            </span>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {PRESET_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] border border-white/[0.04] text-xs text-[var(--on-surface)] transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>{p}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Conversational Live Stream Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Chat Stream (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {messages.map((msg) =>
            msg.sender === "user" ? (
              /* User Bubble */
              <div key={msg.id} className="flex items-start justify-end gap-3 pl-12">
                <div className="flex flex-col items-end gap-1">
                  <div className="p-4 rounded-2xl rounded-tr-xs bg-[var(--surface-container-high)] border border-white/[0.06] text-sm text-[var(--on-surface)] shadow-md max-w-xl">
                    <p>{msg.text}</p>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--on-surface-variant)] pr-1">
                    Alex • {msg.time}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[var(--surface-container-highest)] border border-white/[0.08] flex items-center justify-center font-bold text-xs text-[var(--primary)] shrink-0">
                  A
                </div>
              </div>
            ) : (
              /* Bot Response Card */
              <div key={msg.id} className="flex items-start gap-3 pr-2 sm:pr-8">
                <div className="w-9 h-9 rounded-2xl bg-[var(--primary-container)] text-[var(--on-primary-container)] flex items-center justify-center shrink-0 shadow-lg font-bold text-sm">
                  BW
                </div>
                <div className="flex-1 flex flex-col gap-4 p-5 rounded-3xl rounded-tl-xs bg-[var(--surface-container-low)]/95 border border-white/[0.08] backdrop-blur-xl shadow-xl">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[var(--primary)] font-bold flex items-center gap-1.5 uppercase">
                      <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                      Grounded Synthesis
                    </span>
                    <span className="text-[var(--on-surface-variant)]">{msg.time}</span>
                  </div>
                  <p className="text-sm text-[var(--on-surface)] leading-relaxed">{msg.text}</p>
                </div>
              </div>
            )
          )}

          {/* Primary Grounded Detail Card (Static demo companion from Stitch) */}
          <div className="flex items-start gap-3 pr-2 sm:pr-8">
            <div className="w-9 h-9 rounded-2xl bg-[var(--primary-container)] text-[var(--on-primary-container)] flex items-center justify-center shrink-0 shadow-lg font-bold text-sm">
              BW
            </div>
            <div className="flex-1 flex flex-col gap-4 p-6 rounded-3xl rounded-tl-xs bg-[var(--surface-container-low)]/95 border border-white/[0.08] backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-[var(--primary)] font-bold flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                  Grounded Synthesis Active
                </span>
                <span className="text-[var(--on-surface-variant)]">Generated 14:34 EDT</span>
              </div>

              <p className="text-sm sm:text-base text-[var(--on-surface)] leading-relaxed">
                Hey Alex! You are <span className="font-semibold text-[var(--primary)] underline decoration-[var(--primary)]/40 decoration-2 underline-offset-4">100% in the clear</span> for that 10-mile run until <strong className="text-[var(--on-surface)]">5:30 PM</strong>. AQI is hovering at a crisp <span className="font-mono text-[var(--primary)] font-bold">34</span> right now. Around 6:00 PM, rush hour will push PM2.5 up near the bridge. Here is your game plan:
              </p>

              {/* Action Prescription Bento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--surface-container)] border border-white/[0.04] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">👟</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-mono text-[10px] font-bold">
                      OPTIMAL
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs text-[var(--on-surface-variant)] block">Best Window</span>
                    <span className="font-heading text-base font-bold text-[var(--on-surface)]">
                      3:30 – 5:15 PM
                    </span>
                    <span className="text-xs text-[var(--primary)] block mt-0.5">
                      Waterfront (SW breeze)
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-container)] border border-white/[0.04] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🫁</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-mono text-[10px] font-bold">
                      SAFE
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs text-[var(--on-surface-variant)] block">Asthma Risk Factor</span>
                    <span className="font-heading text-base font-bold text-[var(--on-surface)]">
                      0 / 5
                    </span>
                    <span className="text-xs text-[var(--on-surface-variant)] block mt-0.5">
                      Bronchial stress: 1.2%
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-container)] border border-white/[0.04] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🌬️</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--secondary-container)]/30 text-[var(--secondary)] font-mono text-[10px] font-bold">
                      HEADS UP
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs text-[var(--on-surface-variant)] block">Inversion Alert</span>
                    <span className="font-heading text-base font-bold text-[var(--secondary)]">
                      After 8:00 PM
                    </span>
                    <span className="text-xs text-[var(--on-surface-variant)] block mt-0.5">
                      Trap soot. Close windows.
                    </span>
                  </div>
                </div>
              </div>

              {/* Inhaled Dose Projection SVG Curve */}
              <div className="p-4 rounded-2xl bg-[var(--surface-container-high)]/70 border border-white/[0.04] flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-semibold text-[var(--on-surface)]">
                    Projected PM2.5 Inhalation Curve (10mi Tempo Pace)
                  </span>
                  <span className="text-[var(--primary)] text-[10px]">Budget: 8.4 / 50 µg safe cap</span>
                </div>

                <div className="w-full h-16 relative">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 700 80">
                    <path
                      d="M 0 65 Q 120 62, 240 58 T 420 52 Q 520 40, 600 24 T 700 12 L 700 75 L 0 75 Z"
                      fill="rgba(78,222,163,0.15)"
                    />
                    <path
                      d="M 0 65 Q 120 62, 240 58 T 420 52 Q 520 40, 600 24 T 700 12"
                      fill="none"
                      stroke="#4edea3"
                      strokeWidth="2.5"
                    />
                    <circle cx="420" cy="52" fill="#dfe2ef" r="5" stroke="#10b981" strokeWidth="2" />
                    <circle cx="600" cy="24" fill="#ffb2b7" r="5" stroke="#b50036" strokeWidth="2" />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[var(--on-surface-variant)] font-mono text-[10px]">
                  <span>3:30 PM (AQI 32)</span>
                  <span className="text-[var(--primary)]">4:30 PM (Mid-Run Optimal)</span>
                  <span>5:30 PM (Cutoff)</span>
                  <span className="text-[var(--secondary)]">6:30 PM (Rush Inversion AQI 68)</span>
                </div>
              </div>

              {/* Citations & Feedback */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]">
                <span className="font-mono text-[10px] text-[var(--on-surface-variant)] uppercase mr-1">
                  Hard Telemetry Proof:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-container)] text-[var(--primary)] font-mono text-[10px] border border-white/[0.04]">
                  EPA #402: 8.1 µg/m³
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-container)] text-[var(--tertiary)] font-mono text-[10px] border border-white/[0.04]">
                  HRRR Wind: 11 mph SW
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-container)] text-[var(--on-surface)] font-mono text-[10px] border border-white/[0.04]">
                  VIIRS Band 4: Clear
                </span>
              </div>
            </div>
          </div>

          {isTyping && (
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--primary)] animate-pulse">
              <Bot className="w-4 h-4" />
              <span>Analyzing sensor telemetry mesh...</span>
            </div>
          )}
        </div>

        {/* Right Column: Live Context & Atmosphere Sentinel (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Active Run Vector Preview */}
          <div className="rounded-2xl bg-[var(--surface-container-low)]/90 border border-white/[0.08] backdrop-blur-xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-bold text-[var(--on-surface)]">
                Active Run Vector
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-mono text-[10px]">
                CLEAN POCKET
              </span>
            </div>

            <div className="w-full h-36 rounded-xl bg-[var(--surface-container-high)] border border-white/[0.06] p-3 flex flex-col justify-end">
              <div className="bg-[var(--surface-container-lowest)]/80 backdrop-blur-md p-2 rounded-lg flex items-center justify-between font-mono text-xs">
                <span className="text-[var(--on-surface)]">Waterfront Pier 1 to 6</span>
                <span className="text-[var(--primary)] font-bold">AQI 29</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-container)]">
                <span className="text-[var(--on-surface-variant)] text-[11px]">PM2.5 Mass</span>
                <strong className="text-[var(--on-surface)]">8.1 µg/m³</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-container)]">
                <span className="text-[var(--on-surface-variant)] text-[11px]">Ground Ozone</span>
                <strong className="text-[var(--on-surface)]">32 ppb</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-container)]">
                <span className="text-[var(--on-surface-variant)] text-[11px]">Inversion Alt</span>
                <strong className="text-[var(--on-surface)]">420 m</strong>
              </div>
            </div>
          </div>

          {/* Today's Dose Ledger */}
          <div className="rounded-2xl bg-[var(--surface-container-low)]/90 border border-white/[0.08] backdrop-blur-xl p-5 flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-bold text-[var(--on-surface)]">
                Today's Dose Ledger
              </span>
              <span className="font-mono text-xs text-[var(--primary)] font-bold">24% USED</span>
            </div>
            <p className="text-xs text-[var(--on-surface-variant)]">
              12.1 µg absorbed. 76% daily respiratory budget remains.
            </p>
            <div className="p-3 rounded-xl bg-[var(--surface-container)] border border-white/[0.04] text-xs text-[var(--on-surface)]">
              Bedroom purifier set to <strong className="text-[var(--primary)]">Auto-Eco</strong>. Zero boost required till 8 PM.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sticky Floating Interactive Chat Bar */}
      <div className="sticky bottom-4 z-30 w-full mt-4">
        <div className="w-full max-w-4xl mx-auto rounded-2xl bg-[var(--surface-container-high)]/95 border border-white/[0.1] backdrop-blur-2xl p-2 px-4 shadow-2xl flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything about your air, route, or symptoms..."
              className="flex-1 bg-transparent text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]/60 focus:outline-none"
            />
            <button
              onClick={() => handleSend()}
              className="w-10 h-10 rounded-xl bg-[var(--primary)] text-[var(--on-primary-container)] flex items-center justify-center font-bold hover:brightness-105 transition-all cursor-pointer shadow-md"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--on-surface-variant)] px-1">
            <span className="flex items-center gap-1 text-[var(--primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              Connected to live atmosphere telemetry
            </span>
            <span>Press Enter ↵ to query</span>
          </div>
        </div>
      </div>
    </div>
  );
}
