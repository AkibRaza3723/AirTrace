"use client";

import { useState } from "react";
import {
  Shield, Wind, AlertTriangle, Clock, Activity,
  Laptop, TrendingUp, BarChart3, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ActivityItem {
  id: string; name: string; emoji: string; duration: string;
  ve: string; veLabel: string; dose: number;
}

const ACTIVITIES: ActivityItem[] = [
  { id: "walk",   name: "Walking Commute",      emoji: "🚶", duration: "30 min · Sidewalk", ve: "18 L/min", veLabel: "Modest effort",  dose: 2.1 },
  { id: "cycle",  name: "Cycling / High Exertion", emoji: "🚴", duration: "45 min · Bike lane", ve: "45 L/min", veLabel: "Rapid breath", dose: 5.4 },
  { id: "desk",   name: "Desk Work + HEPA",     emoji: "💻", duration: "6 hrs · Purified",  ve: "7.5 L/min", veLabel: "HEPA Active", dose: 0.8 },
  { id: "coffee", name: "Coffee on Patio",       emoji: "☕", duration: "20 min · Courtyard", ve: "8.0 L/min", veLabel: "Resting",     dose: 1.1 },
];

const TIMELINE = [
  { hour: "6am",  idx: 28, label: "Good"     },
  { hour: "7am",  idx: 32, label: "Good"     },
  { hour: "8am",  idx: 55, label: "Moderate" },
  { hour: "9am",  idx: 62, label: "Moderate" },
  { hour: "10am", idx: 48, label: "Good"     },
  { hour: "12pm", idx: 38, label: "Good"     },
  { hour: "3pm",  idx: 40, label: "Good"     },
  { hour: "5pm",  idx: 53, label: "Moderate" },
  { hour: "7pm",  idx: 44, label: "Good"     },
  { hour: "9pm",  idx: 35, label: "Good"     },
];

function getExposureColor(score: number) {
  if (score < 30) return { text: "text-emerald-600", bg: "bg-emerald-500", status: "status-good", label: "Low Exposure" };
  if (score < 60) return { text: "text-amber-600",   bg: "bg-amber-500",   status: "status-moderate", label: "Moderate" };
  return { text: "text-red-600", bg: "bg-red-500", status: "status-unhealthy", label: "High Exposure" };
}

export default function ExposurePage() {
  const [selected, setSelected] = useState<ActivityItem>(ACTIVITIES[0]);
  const [logged, setLogged] = useState(false);

  const score = Math.round(24 + selected.dose * 2);
  const ec = getExposureColor(score);

  return (
    <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personal Exposure Timeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">Estimated inhaled dose based on your activity and ambient air quality.</p>
        </div>
        <Badge className="status-good border-0 text-xs">Brooklyn, NY · AQI 38 · Good</Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT — Exposure Score + Activity Picker */}
        <div className="xl:col-span-5 flex flex-col gap-5">

          {/* Exposure Score */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <div className={cn("h-1 w-full", ec.bg)} />
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="relative w-40 h-40">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle cx="80" cy="80" r="70" fill="none"
                    stroke={score < 30 ? "#10b981" : score < 60 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="10"
                    strokeDasharray={`${(score / 100) * 440} 440`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Exposure</span>
                  <span className={cn("font-mono text-4xl font-bold", ec.text)}>{score}</span>
                  <span className="text-[10px] text-gray-400">/ 100</span>
                </div>
              </div>
              <div>
                <span className={cn("inline-block text-xs font-semibold px-3 py-1 rounded-full mb-2", ec.status)}>{ec.label}</span>
                <p className="text-sm text-gray-500">Based on <strong className="text-gray-700">{selected.name}</strong> with current air quality.</p>
              </div>
              <Button
                onClick={() => setLogged(true)}
                disabled={logged}
                className={cn("w-full", logged ? "bg-emerald-600 hover:bg-emerald-600" : "gradient-primary")}
              >
                {logged ? "✓ Session Logged" : "Log This Session"}
              </Button>
            </CardContent>
          </Card>

          {/* Activity Selector */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Activity Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {ACTIVITIES.map((act) => (
                <button
                  key={act.id}
                  onClick={() => { setSelected(act); setLogged(false); }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                    selected.id === act.id
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <span className="text-xl w-8 text-center">{act.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{act.name}</p>
                    <p className="text-xs text-gray-400">{act.duration} · {act.ve} · {act.veLabel}</p>
                  </div>
                  <span className={cn("font-mono text-sm font-bold",
                    act.dose < 2 ? "text-emerald-600" : act.dose < 4 ? "text-amber-600" : "text-red-600"
                  )}>{act.dose}x</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — 24h Timeline + Tips */}
        <div className="xl:col-span-7 flex flex-col gap-5">

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  24-Hour Exposure Timeline
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">PM2.5 Based</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Peak callout */}
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Peak Window: 8:00–10:00 AM</p>
                  <p className="text-xs text-amber-700">Rush-hour PM2.5 spike. Limit high-exertion outdoor activity during this window.</p>
                </div>
              </div>

              {/* Timeline bars */}
              <div className="flex items-end gap-2 h-32">
                {TIMELINE.map((slot) => {
                  const pct = (slot.idx / 80) * 100;
                  const barColor = slot.idx <= 50 ? "bg-emerald-500" : "bg-amber-500";
                  return (
                    <div key={slot.hour} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full flex items-end" style={{ height: "96px" }}>
                        <div className={cn("w-full rounded-t-md transition-all", barColor)} style={{ height: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono">{slot.hour}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />Good (AQI ≤ 50)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />Moderate (AQI 51–100)</span>
              </div>
            </CardContent>
          </Card>

          {/* Reduction Tips */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Exposure Reduction Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "🕐", tip: "Shift outdoor exercise to after 10 AM or after 7 PM.", save: "–38%" },
                  { icon: "🚇", tip: "Use transit instead of cycling during peak hours.", save: "–55%" },
                  { icon: "🏠", tip: "Run HEPA purifier at high during 8–10 AM window.", save: "–70%" },
                  { icon: "🛣️", tip: "Choose secondary roads over arterial highways.", save: "–28%" },
                ].map((t) => (
                  <div key={t.tip} className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-lg">{t.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 leading-relaxed">{t.tip}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 shrink-0">{t.save}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
