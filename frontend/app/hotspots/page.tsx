"use client";

import { useState } from "react";
import {
  Satellite, Flame, Wind, Plus, Minus, MapPin, AlertTriangle,
  Users, ShieldCheck, CheckCircle2, Send, Compass, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterType = "wildfire" | "stubble" | "industrial" | "community";

const FILTER_TABS: { id: FilterType; label: string; color: string }[] = [
  { id: "wildfire",    label: "Wildfire",    color: "text-red-600"    },
  { id: "stubble",     label: "Stubble Fire", color: "text-amber-600" },
  { id: "industrial",  label: "Industrial",  color: "text-gray-600"   },
  { id: "community",   label: "Community",   color: "text-blue-600"   },
];

const FIRE_EVENTS = [
  { id: 1, name: "Upstate NY Agricultural",  lat: 42.1, lon: -74.2, frp: 48, dist: "142 km N",  confidence: "High",   direction: "Away",    risk: "low"  },
  { id: 2, name: "Central NJ Scrubland",     lat: 40.1, lon: -74.8, frp: 12, dist: "68 km SW",  confidence: "Nominal", direction: "Neutral", risk: "low"  },
  { id: 3, name: "Long Island Brush Fire",   lat: 40.8, lon: -72.6, frp: 28, dist: "42 km E",   confidence: "High",   direction: "Away",    risk: "medium"},
];

export default function HotspotsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("wildfire");
  const [modalOpen, setModalOpen]       = useState(false);
  const [reportType, setReportType]     = useState("burning");
  const [reporting, setReporting]       = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [zoom, setZoom]                 = useState(10);

  function handleReport() {
    setReporting(true);
    setTimeout(() => { setReporting(false); setReportSuccess(true); setTimeout(() => { setReportSuccess(false); setModalOpen(false); }, 2000); }, 1200);
  }

  return (
    <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satellite Thermal Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5">NASA FIRMS VIIRS/MODIS fire detection and smoke trajectory tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-emerald-700">Low Threat in Radius</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-600">
            <Satellite className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono">VIIRS · T-18m</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
              activeFilter === tab.id ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Map */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <div className="relative h-[420px] bg-gradient-to-br from-slate-100 via-blue-50 to-slate-50">
              {/* Map grid */}
              <div className="absolute inset-0 opacity-15">
                {Array.from({length:10}).map((_,i)=>(
                  <div key={i} className="absolute border-slate-400" style={{top:`${i*10}%`,left:0,right:0,borderTopWidth:1}} />
                ))}
                {Array.from({length:12}).map((_,i)=>(
                  <div key={i} className="absolute border-slate-400" style={{left:`${i*8.33}%`,top:0,bottom:0,borderLeftWidth:1}} />
                ))}
              </div>

              {/* Fire markers */}
              {FIRE_EVENTS.map((f, i) => (
                <div
                  key={f.id}
                  className={cn(
                    "absolute flex flex-col items-center gap-1 cursor-pointer group",
                    i === 0 ? "top-1/4 left-1/3" : i === 1 ? "top-1/2 left-1/4" : "top-1/3 right-1/4"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-transform group-hover:scale-110",
                    f.risk === "medium" ? "bg-orange-500" : "bg-amber-400"
                  )}>
                    <Flame className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap shadow-xl">
                    {f.name} · {f.dist}
                  </div>
                </div>
              ))}

              {/* User location */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg" />
                <div className="absolute inset-0 animate-ping w-4 h-4 rounded-full bg-blue-400 opacity-40" />
              </div>

              {/* Wind direction */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-gray-200 shadow text-xs">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium text-gray-700">Wind: NW 11 mph</span>
              </div>

              {/* Zoom */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-1">
                <button onClick={() => setZoom(z => Math.min(z+1, 18))} className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <button onClick={() => setZoom(z => Math.max(z-1, 5))} className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded font-mono">
                Zoom {zoom} · FIRMS NRT Feed
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />Low confidence</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />High confidence</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />Your location</span>
            </div>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Detected Events */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Detected Events
                <Badge className="ml-auto bg-orange-100 text-orange-700 border-orange-200">{FIRE_EVENTS.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {FIRE_EVENTS.map((f) => (
                <div key={f.id} className={cn("p-3 rounded-xl border",
                  f.risk === "medium" ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{f.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{f.dist} · FRP {f.frp} MW</p>
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                      f.direction === "Away" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    )}>{f.direction}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Community Report */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Report a Hotspot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!modalOpen ? (
                <Button onClick={() => setModalOpen(true)} variant="outline" className="w-full border-gray-200">
                  + Submit Community Report
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Select value={reportType} onValueChange={(v) => setReportType(v ?? reportType)}>
                    <SelectTrigger className="border-gray-200 bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="burning">Open burning / waste fire</SelectItem>
                      <SelectItem value="construction">Construction dust plume</SelectItem>
                      <SelectItem value="industrial">Industrial emission</SelectItem>
                      <SelectItem value="stubble">Agricultural stubble</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Location description..." className="border-gray-200 bg-gray-50" />
                  <div className="flex gap-2">
                    <Button onClick={handleReport} disabled={reporting || reportSuccess} className={cn("flex-1 text-sm", reportSuccess ? "bg-emerald-600 hover:bg-emerald-600" : "gradient-primary")}>
                      {reportSuccess ? <><CheckCircle2 className="w-4 h-4 mr-1" />Submitted</> :
                       reporting ? "Sending..." : <><Send className="w-4 h-4 mr-1" />Submit</>}
                    </Button>
                    <Button variant="outline" onClick={() => setModalOpen(false)} className="border-gray-200">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
