"use client";

import { useState } from "react";
import {
  Building2, ChevronDown, ShieldCheck, CheckCircle, Clock,
  Send, FileText, Users, AlertCircle, Wind, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface Campus { name: string; type: string; aqi: number; pm25: number; }

const CAMPUSES: Campus[] = [
  { name: "NYU Downtown Campus", type: "Collegiate / Urban Core", aqi: 32, pm25: 6.4 },
  { name: "St. Jude Elementary Academy", type: "Pre-K–Grade 5 / Courtyard Hub", aqi: 28, pm25: 5.2 },
  { name: "Midwood Regional High School", type: "Grades 9-12 Interscholastic", aqi: 35, pm25: 7.1 },
];

const PROTOCOL_RULES = [
  { activity: "Morning Assembly (Outdoor)", threshold: "AQI < 100", status: "green", icon: CheckCircle },
  { activity: "Physical Education (Outdoor)", threshold: "PM2.5 < 35 µg/m³", status: "green", icon: CheckCircle },
  { activity: "Recess (30 min)",  threshold: "AQI < 50 — Full duration OK", status: "green", icon: CheckCircle },
  { activity: "Interscholastic Sports", threshold: "AQI < 100", status: "green", icon: CheckCircle },
  { activity: "Field Trips (Outdoor)",  threshold: "PM2.5 < 25 µg/m³",    status: "amber", icon: AlertCircle },
];

export default function SchoolsPage() {
  const [selectedCampus, setSelectedCampus] = useState<Campus>(CAMPUSES[0]);
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [broadcastSent, setBroadcastSent]  = useState(false);
  const [sending, setSending]              = useState(false);
  const [draft, setDraft]                  = useState(
    `Daily Air Clearance for ${CAMPUSES[0].name}: Today is a Green Air Day (AQI ${CAMPUSES[0].aqi}). Outdoor PE, recess, and athletics are fully approved.`
  );

  const overallStatus = selectedCampus.aqi <= 50 ? "green" : selectedCampus.aqi <= 100 ? "amber" : "red";

  function handleBroadcast() {
    setSending(true);
    setTimeout(() => { setSending(false); setBroadcastSent(true); }, 1200);
  }

  return (
    <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campus Safety Protocol</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time outdoor activity clearance for schools and colleges.</p>
        </div>

        {/* Campus Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Campus</p>
              <p className="text-sm font-semibold text-gray-900">{selectedCampus.name}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 rounded-xl bg-white border border-gray-200 shadow-xl p-2 z-40 animate-fade-up">
              {CAMPUSES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setSelectedCampus(c); setDropdownOpen(false); setDraft(`Daily Air Clearance for ${c.name}: Today is a Green Air Day (AQI ${c.aqi}). Outdoor PE, recess, and athletics are fully approved.`); setBroadcastSent(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer",
                    selectedCampus.name === c.name ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{c.name}</span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                      c.aqi <= 50 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>AQI {c.aqi}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{c.type}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={cn("p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4",
        overallStatus === "green" ? "bg-emerald-50 border-emerald-200" :
        overallStatus === "amber" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm",
            overallStatus === "green" ? "bg-emerald-500" : overallStatus === "amber" ? "bg-amber-500" : "bg-red-500"
          )}>
            {overallStatus === "green" ? "🟢" : overallStatus === "amber" ? "🟡" : "🔴"}
          </div>
          <div>
            <h2 className={cn("text-xl font-bold",
              overallStatus === "green" ? "text-emerald-800" : overallStatus === "amber" ? "text-amber-800" : "text-red-800"
            )}>
              {overallStatus === "green" ? "Green Day — All Outdoor Activities Approved" :
               overallStatus === "amber" ? "Amber Day — Moderate Restrictions Apply" :
               "Red Day — Move Activities Indoors"}
            </h2>
            <p className={cn("text-sm mt-0.5",
              overallStatus === "green" ? "text-emerald-700" : overallStatus === "amber" ? "text-amber-700" : "text-red-700"
            )}>
              {selectedCampus.name} · AQI {selectedCampus.aqi} · PM2.5 {selectedCampus.pm25} µg/m³
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-1">
          <span className="font-mono text-2xl font-bold text-gray-900">{selectedCampus.aqi}</span>
          <span className="text-xs text-gray-500">Air Quality Index</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Protocol Table */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Activity Protocol Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {PROTOCOL_RULES.map((rule) => {
                  const isOk = overallStatus === "green" || (overallStatus === "amber" && rule.status === "green");
                  return (
                    <div key={rule.activity} className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border",
                      isOk ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
                    )}>
                      <rule.icon className={cn("w-5 h-5 shrink-0", isOk ? "text-emerald-600" : "text-amber-600")} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{rule.activity}</p>
                        <p className="text-xs text-gray-400">{rule.threshold}</p>
                      </div>
                      <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full",
                        isOk ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                      )}>
                        {isOk ? "PROCEED" : "LIMIT"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Hourly Schedule */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Hourly Safety Windows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { time: "6–8 AM", aqi: 30, ok: true }, { time: "8–10 AM", aqi: 58, ok: false },
                  { time: "10–12 PM", aqi: 42, ok: true }, { time: "12–2 PM", aqi: 38, ok: true },
                  { time: "2–4 PM", aqi: 35, ok: true }, { time: "4–6 PM", aqi: 52, ok: false },
                  { time: "6–8 PM", aqi: 40, ok: true }, { time: "8–10 PM", aqi: 30, ok: true },
                ].map((slot) => (
                  <div key={slot.time} className={cn(
                    "p-3 rounded-xl text-center border",
                    slot.ok ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                  )}>
                    <p className="text-[10px] text-gray-500 font-medium">{slot.time}</p>
                    <p className={cn("font-mono font-bold text-sm mt-1", slot.ok ? "text-emerald-700" : "text-red-600")}>{slot.aqi}</p>
                    <p className={cn("text-[9px] font-bold", slot.ok ? "text-emerald-600" : "text-red-500")}>{slot.ok ? "CLEAR" : "AVOID"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — Broadcast */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                Broadcast Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-28 text-sm border-gray-200 bg-gray-50 resize-none"
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Users className="w-3.5 h-3.5" />
                <span>Send to: Parents, Staff, Athletes</span>
              </div>
              <Button
                onClick={handleBroadcast}
                disabled={sending || broadcastSent}
                className={cn("w-full", broadcastSent ? "bg-emerald-600 hover:bg-emerald-600" : "gradient-primary")}
              >
                {broadcastSent ? <><CheckCircle className="w-4 h-4 mr-1.5" />Broadcast Sent</> :
                 sending ? "Sending..." :
                 <><Send className="w-4 h-4 mr-1.5" />Broadcast to Campus</>}
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Students Protected", value: "1,240", icon: Users, color: "text-blue-600 bg-blue-50" },
              { label: "Outdoor Events", value: "4 Cleared", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
              { label: "Alert Recipients", value: "86", icon: Send, color: "text-amber-600 bg-amber-50" },
              { label: "PM2.5 Level",  value: `${selectedCampus.pm25} µg/m³`, icon: Wind, color: "text-gray-600 bg-gray-50" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", s.color.split(" ")[1])}>
                  <s.icon className={cn("w-4 h-4", s.color.split(" ")[0])} />
                </div>
                <p className="font-bold text-gray-900 text-lg leading-tight">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
