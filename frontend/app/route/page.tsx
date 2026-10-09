"use client";

import { useState } from "react";
import {
  Navigation, CheckCircle, AlertTriangle, Scale, Bike,
  Footprints, Train, Leaf, Wind, MapPin, ChevronRight, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RouteType = "clean" | "balanced" | "fast";
type ModeType  = "walk" | "cycle" | "transit";

const ROUTES = {
  clean:    { label: "Lowest Exposure",   time: "29 min", exposure: 32, saving: "–50%", color: "text-emerald-600", badgeClass: "status-good",     icon: Leaf,          desc: "Residential streets, park paths — max exposure avoidance." },
  balanced: { label: "Balanced",          time: "26 min", exposure: 41, saving: "–36%", color: "text-blue-600",    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200", icon: Scale,         desc: "4 min longer than fastest. Avoids the truck corridor on 3rd Ave." },
  fast:     { label: "Fastest Route",     time: "22 min", exposure: 64, saving: "—",    color: "text-red-500",     badgeClass: "status-unhealthy",  icon: Navigation,    desc: "Ring road direct — high exposure from heavy vehicles." },
};

const TRAVEL_MODES = [
  { id: "walk",    label: "Walk",    icon: Footprints, factor: "1.5×" },
  { id: "cycle",   label: "Cycle",   icon: Bike,       factor: "2.5×" },
  { id: "transit", label: "Transit", icon: Train,      factor: "1.0×" },
];

export default function RoutePage() {
  const [selectedRoute, setSelectedRoute] = useState<RouteType>("clean");
  const [selectedMode,  setSelectedMode]  = useState<ModeType>("cycle");
  const [origin, setOrigin]               = useState("Greenpoint Loft, Brooklyn");
  const [destination, setDestination]     = useState("SoHo Creative Studio, Manhattan");
  const [navigating, setNavigating]       = useState(false);

  const active = ROUTES[selectedRoute];

  return (
    <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pollution-Aware Route Planner</h1>
        <p className="text-sm text-gray-500 mt-0.5">Compare routes by travel time and estimated cumulative pollution exposure.</p>
      </div>

      {/* Origin / Destination Input */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 uppercase tracking-wider">Origin</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="pl-9 border-gray-200 bg-gray-50"
                  placeholder="Enter starting point..."
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 uppercase tracking-wider">Destination</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-9 border-gray-200 bg-gray-50"
                  placeholder="Enter destination..."
                />
              </div>
            </div>
          </div>

          {/* Travel Mode + Compare Button */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
              {TRAVEL_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id as ModeType)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                    selectedMode === m.id ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  {m.label}
                  <span className="font-mono text-[10px] text-gray-400">{m.factor}</span>
                </button>
              ))}
            </div>
            <Button
              onClick={() => setNavigating(true)}
              className="gradient-primary ml-auto"
            >
              <Navigation className="w-4 h-4 mr-1.5" />
              {navigating ? "Calculating..." : "Compare Routes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Route Cards */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600" />
            Route Options
          </h2>
          {(Object.entries(ROUTES) as [RouteType, typeof ROUTES.clean][]).map(([key, route]) => (
            <Card
              key={key}
              onClick={() => setSelectedRoute(key)}
              className={cn(
                "border cursor-pointer transition-all shadow-sm",
                selectedRoute === key
                  ? "border-blue-200 shadow-md ring-1 ring-blue-100"
                  : "border-gray-200 hover:border-gray-300 hover:shadow"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                      key === "clean" ? "bg-emerald-50" : key === "balanced" ? "bg-blue-50" : "bg-red-50"
                    )}>
                      <route.icon className={cn("w-4 h-4", route.color)} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{route.label}</p>
                      <p className="text-xs text-gray-400">{route.time}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn("font-mono text-lg font-bold", route.color)}>{route.exposure}</div>
                    <div className="text-[10px] text-gray-400">exp. pts</div>
                    {route.saving !== "—" && (
                      <span className="text-[10px] font-bold text-emerald-600">{route.saving}</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all",
                      key === "clean" ? "bg-emerald-500" : key === "balanced" ? "bg-blue-500" : "bg-red-500"
                    )}
                    style={{ width: `${(route.exposure / 100) * 100}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-2">{route.desc}</p>

                {selectedRoute === key && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs font-semibold text-blue-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Selected Route
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map + Summary */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          {/* Stylized Map Placeholder */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <div className="relative w-full h-72 bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="absolute border-gray-300" style={{ top: `${i * 12.5}%`, left: 0, right: 0, borderTopWidth: 1 }} />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="absolute border-gray-300" style={{ left: `${i * 10}%`, top: 0, bottom: 0, borderLeftWidth: 1 }} />
                ))}
              </div>

              {/* Route line visualization */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 280">
                <path d="M 60 220 C 120 180 200 150 280 90 S 360 60 380 50"
                  fill="none" stroke={selectedRoute === "clean" ? "#10b981" : selectedRoute === "balanced" ? "#3b82f6" : "#ef4444"}
                  strokeWidth="3" strokeDasharray={selectedRoute === "fast" ? "none" : "8 4"}
                  strokeLinecap="round" className="transition-all duration-500"
                />
                <circle cx="60" cy="220" r="7" fill="#1d4ed8" />
                <circle cx="380" cy="50" r="7" fill="#ef4444" />
              </svg>

              <div className="relative flex flex-col items-center text-center gap-1">
                <Navigation className="w-8 h-8 text-blue-300" />
                <span className="text-sm text-gray-400 font-medium">Route visualization</span>
                <span className="text-xs text-gray-400">MapLibre GL integration pending</span>
              </div>

              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                <span className="w-2 h-2 rounded-full" style={{ background: selectedRoute === "clean" ? "#10b981" : selectedRoute === "balanced" ? "#3b82f6" : "#ef4444" }} />
                <span className="font-medium text-gray-700">{active.label}</span>
              </div>
            </div>
          </Card>

          {/* Route Summary */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Selected Route Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: "Travel Time", value: active.time, icon: "⏱" },
                  { label: "Exposure Score", value: `${active.exposure} pts`, icon: "💨" },
                  { label: "Reduction", value: active.saving === "—" ? "Baseline" : active.saving, icon: "📉" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-xl mb-1">{stat.icon}</div>
                    <div className="font-mono font-bold text-gray-900 text-sm">{stat.value}</div>
                    <div className="text-[10px] text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800">
                <strong>Recommendation:</strong> {selectedRoute === "fast"
                  ? "This route maximizes speed but exposes you to high truck traffic pollution. Consider the balanced route."
                  : selectedRoute === "balanced"
                  ? "Great choice — only 4 extra minutes saves 36% of inhaled PM2.5 versus the fastest route."
                  : "Optimal for low exposure. Takes 7 extra minutes but cuts inhaled dose by half."}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
