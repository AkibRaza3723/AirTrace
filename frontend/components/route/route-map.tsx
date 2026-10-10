"use client";

import { useEffect, useRef } from "react";
import { Maximize2 } from "lucide-react";

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface RouteGeometry {
  key: "clean" | "balanced" | "fast";
  label: string;
  color: string;
  strokeColor: string;
  points: [number, number][];
  aqi: number;
}

interface StationMarker {
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  status: string;
}

interface RouteMapProps {
  origin: { label: string; coords: [number, number] };
  destination: { label: string; coords: [number, number] };
  routes: {
    clean: RouteGeometry;
    balanced: RouteGeometry;
    fast: RouteGeometry;
  };
  selectedRoute: "clean" | "balanced" | "fast";
  onSelectRoute: (key: "clean" | "balanced" | "fast") => void;
  stations?: StationMarker[];
}

export default function RouteMap({
  origin,
  destination,
  routes,
  selectedRoute,
  onSelectRoute,
  stations = [],
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const polylinesRef = useRef<Record<string, any>>({});
  const leafletRef = useRef<any>(null);

  // Initialize Leaflet dynamically on client mount
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current) return;

      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (isCancelled || !mapContainerRef.current) return;

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [28.6139, 77.2090], // Central Delhi
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      // Use CARTO if API key is provided, otherwise OpenStreetMap (100% free, no key needed)
      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
      const tileUrl = cartoKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${cartoKey}`
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: cartoKey ? "abcd" : ["a", "b", "c"],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerGroupRef.current = layerGroup;

      renderLayers(L, map, layerGroup);
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Re-render layers when route/selection changes
  const renderLayers = (L: any, map: any, layerGroup: any) => {
    if (!L || !map || !layerGroup) return;

    layerGroup.clearLayers();
    polylinesRef.current = {};

    // 1. Draw Delhi Monitoring Stations
    stations.forEach((st) => {
      const getBg = (aqi: number) => {
        if (aqi <= 100) return "bg-emerald-500 text-white";
        if (aqi <= 200) return "bg-amber-500 text-white";
        if (aqi <= 300) return "bg-orange-500 text-white";
        return "bg-rose-600 text-white";
      };

      const icon = L.divIcon({
        className: "custom-station-pin",
        html: `
          <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-full ${getBg(st.aqi)} shadow-md border border-white text-[10px] font-mono font-bold whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform">
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span>${st.name.split(" ")[0]} ${st.aqi}</span>
          </div>
        `,
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      });

      L.marker([st.lat, st.lng], { icon })
        .bindTooltip(`<strong>${st.name} Station</strong><br/>CPCB AQI: ${st.aqi} (${st.status})`, {
          direction: "top",
        })
        .addTo(layerGroup);
    });

    // 2. Draw Polylines for the 3 corridors
    (["fast", "balanced", "clean"] as const).forEach((key) => {
      const r = routes[key];
      const isSelected = selectedRoute === key;
      const strokeColor = key === "clean" ? "#10b981" : key === "balanced" ? "#3b82f6" : "#f43f5e";

      // Glow halo if selected
      if (isSelected) {
        L.polyline(r.points, {
          color: strokeColor,
          weight: 12,
          opacity: 0.22,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(layerGroup);
      }

      const poly = L.polyline(r.points, {
        color: strokeColor,
        weight: isSelected ? 6.5 : 3.5,
        opacity: isSelected ? 1 : 0.45,
        dashArray: key === "clean" ? (isSelected ? "8, 6" : "6, 6") : undefined,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layerGroup);

      poly.on("click", () => onSelectRoute(key));
      poly.bindTooltip(
        `<div class="text-xs font-semibold ${r.color}">
          ${r.label} · ${r.aqi} AQI
          ${key === "clean" ? " (Safest / Lowest Exposure)" : ""}
        </div>`,
        { sticky: true }
      );

      polylinesRef.current[key] = poly;
    });

    // 3. Origin Marker (Clean pin A, no intrusive text bubble)
    const originIcon = L.divIcon({
      className: "custom-origin-pin",
      html: `
        <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-full">
          <div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold ring-2 ring-emerald-200">
            A
          </div>
          <div class="absolute -bottom-1 w-2 h-2 bg-emerald-600 rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [28, 34],
      iconAnchor: [14, 30],
    });
    L.marker(origin.coords, { icon: originIcon })
      .bindTooltip(`<strong>Origin:</strong> ${origin.label.split("(")[0].trim()}`, { direction: "top" })
      .addTo(layerGroup);

    // 4. Destination Marker (Clean pin B, no intrusive text bubble)
    const destIcon = L.divIcon({
      className: "custom-dest-pin",
      html: `
        <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-full">
          <div class="w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-200">
            B
          </div>
          <div class="absolute -bottom-1 w-2 h-2 bg-blue-600 rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [28, 34],
      iconAnchor: [14, 30],
    });
    L.marker(destination.coords, { icon: destIcon })
      .bindTooltip(`<strong>Destination:</strong> ${destination.label.split("(")[0].trim()}`, { direction: "top" })
      .addTo(layerGroup);

    // Auto-fit bounds
    const activePoly = polylinesRef.current[selectedRoute];
    if (activePoly) {
      map.fitBounds(activePoly.getBounds(), {
        padding: [60, 60],
        maxZoom: 14,
        animate: true,
      });
    }
  };

  useEffect(() => {
    if (mapRef.current && layerGroupRef.current && leafletRef.current) {
      renderLayers(leafletRef.current, mapRef.current, layerGroupRef.current);
    }
  }, [origin, destination, routes, selectedRoute, stations]);

  const recenter = () => {
    const activePoly = polylinesRef.current[selectedRoute];
    if (activePoly && mapRef.current) {
      mapRef.current.fitBounds(activePoly.getBounds(), {
        padding: [60, 60],
        maxZoom: 14,
        animate: true,
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[560px] rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs bg-slate-100 flex flex-col">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" style={{ zIndex: 1 }} />

      {/* Floating HUD Controls Top Left */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm text-xs font-semibold text-gray-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Delhi GIS Telemetry Radar</span>
        </div>
        <button
          onClick={recenter}
          className="p-2 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm text-gray-700 hover:text-blue-600 hover:bg-white transition-all cursor-pointer"
          title="Recenter Route"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Route Legend Bottom Left */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-md text-[11px]">
        <div
          onClick={() => onSelectRoute("clean")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
            selectedRoute === "clean" ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shadow-xs" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          <span>Green Canopy (Safest)</span>
        </div>
        <div
          onClick={() => onSelectRoute("balanced")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
            selectedRoute === "balanced" ? "bg-blue-50 text-blue-800 font-bold border border-blue-300 shadow-xs" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
          <span>Arterial Corridor</span>
        </div>
        <div
          onClick={() => onSelectRoute("fast")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
            selectedRoute === "fast" ? "bg-rose-50 text-rose-800 font-bold border border-rose-300 shadow-xs" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
          <span>Ring Road (High AQI)</span>
        </div>
      </div>
    </div>
  );
}
