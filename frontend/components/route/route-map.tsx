"use client";

import { useEffect, useRef, useCallback } from "react";
import { Maximize2, MapPin, Navigation, Compass, Layers } from "lucide-react";

export interface RouteGeometryItem {
  index: number;
  label: string;
  geometry: [number, number][];
  strokeColor: string;
  pollutionScore: number;
}

export interface StationMarker {
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  status: string;
}

interface RouteMapProps {
  origin: { label: string; coords: [number, number] } | null;
  destination: { label: string; coords: [number, number] } | null;
  routes: RouteGeometryItem[];
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isPlanning?: boolean;
  stations?: StationMarker[];
}

export default function RouteMap({
  origin,
  destination,
  routes = [],
  selectedRouteIndex = 0,
  onSelectRoute,
  onMapClick,
  isPlanning = false,
  stations = [],
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const polylinesRef = useRef<Record<number, any>>({});
  const leafletRef = useRef<any>(null);

  // Store click handler in ref to avoid reattaching Leaflet listeners on every render
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Recenter / fit bounds helper
  const recenter = useCallback(() => {
    if (!mapRef.current || !leafletRef.current) return;
    const map = mapRef.current;
    const L = leafletRef.current;

    const activePoly = polylinesRef.current[selectedRouteIndex];
    if (activePoly && typeof activePoly.getBounds === "function") {
      try {
        map.fitBounds(activePoly.getBounds(), {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
        });
        return;
      } catch (e) {
        // polyline bounds may be empty or invalid
      }
    }

    if (origin && destination) {
      const bounds = L.latLngBounds([origin.coords, destination.coords]);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 14, animate: true });
    } else if (origin) {
      map.setView(origin.coords, 13, { animate: true });
    } else if (destination) {
      map.setView(destination.coords, 13, { animate: true });
    } else {
      map.setView([28.6139, 77.2090], 11, { animate: true });
    }
  }, [selectedRouteIndex, origin, destination]);

  // Render map layers
  const renderLayers = useCallback(
    (L: any, map: any, layerGroup: any) => {
      if (!L || !map || !layerGroup) return;

      layerGroup.clearLayers();
      polylinesRef.current = {};

      // 1. Draw Monitoring Stations (if any)
      stations.forEach((st) => {
        const getBg = (aqi: number) => {
          if (aqi <= 50) return "bg-emerald-500 text-white";
          if (aqi <= 100) return "bg-green-500 text-white";
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
          iconSize: [42, 20],
          iconAnchor: [21, 10],
        });

        L.marker([st.lat, st.lng], { icon })
          .bindTooltip(`<strong>${st.name} Station</strong><br/>Estimated AQI: ${st.aqi} (${st.status})`, {
            direction: "top",
          })
          .addTo(layerGroup);
      });

      // 2. Draw Polylines for each route alternative
      // Draw non-selected routes first so selected route renders on top
      const sortedRoutes = [...routes].sort((a, b) => {
        if (a.index === selectedRouteIndex) return 1;
        if (b.index === selectedRouteIndex) return -1;
        return 0;
      });

      sortedRoutes.forEach((r) => {
        if (!r.geometry || r.geometry.length === 0) return;
        const isSelected = r.index === selectedRouteIndex;
        const strokeColor = r.strokeColor || "#10b981";

        // Glow halo for selected route
        if (isSelected) {
          L.polyline(r.geometry, {
            color: strokeColor,
            weight: 14,
            opacity: 0.25,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(layerGroup);
        }

        const poly = L.polyline(r.geometry, {
          color: strokeColor,
          weight: isSelected ? 6 : 3.5,
          opacity: isSelected ? 1 : 0.45,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(layerGroup);

        poly.on("click", () => onSelectRoute(r.index));
        poly.bindTooltip(
          `<div class="text-xs font-semibold px-1 py-0.5">
            <span style="color: ${strokeColor}">●</span> ${r.label}
            <span class="text-gray-500 font-mono text-[11px] block mt-0.5">Est. Score: ${r.pollutionScore}</span>
          </div>`,
          { sticky: true }
        );

        polylinesRef.current[r.index] = poly;
      });

      // 3. Origin Marker (A)
      if (origin && origin.coords) {
        const originIcon = L.divIcon({
          className: "custom-origin-pin",
          html: `
            <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-full">
              <div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ring-2 ring-emerald-200">
                A
              </div>
              <div class="absolute -bottom-1 w-2 h-2 bg-emerald-600 rotate-45 border-r border-b border-white"></div>
            </div>
          `,
          iconSize: [28, 34],
          iconAnchor: [14, 30],
        });

        L.marker(origin.coords, { icon: originIcon, zIndexOffset: 1000 })
          .bindTooltip(`<strong>Origin (A):</strong> ${origin.label.split(",")[0].trim()}`, {
            direction: "top",
          })
          .addTo(layerGroup);
      }

      // 4. Destination Marker (B)
      if (destination && destination.coords) {
        const destIcon = L.divIcon({
          className: "custom-dest-pin",
          html: `
            <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-full">
              <div class="w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-200">
                B
              </div>
              <div class="absolute -bottom-1 w-2 h-2 bg-blue-600 rotate-45 border-r border-b border-white"></div>
            </div>
          `,
          iconSize: [28, 34],
          iconAnchor: [14, 30],
        });

        L.marker(destination.coords, { icon: destIcon, zIndexOffset: 1000 })
          .bindTooltip(`<strong>Destination (B):</strong> ${destination.label.split(",")[0].trim()}`, {
            direction: "top",
          })
          .addTo(layerGroup);
      }

      // Auto-fit bounds when new routes or points arrive
      recenter();
    },
    [routes, selectedRouteIndex, origin, destination, stations, onSelectRoute, recenter]
  );

  // Initialize Leaflet map
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

      // Carto Voyager or OpenStreetMap
      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
      const tileUrl = cartoKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${cartoKey}`
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: cartoKey ? "abcd" : ["a", "b", "c"],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerGroupRef.current = layerGroup;

      // Handle Map Click
      map.on("click", (e: any) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

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

  // Re-render layers when dependencies change
  useEffect(() => {
    if (mapRef.current && layerGroupRef.current && leafletRef.current) {
      renderLayers(leafletRef.current, mapRef.current, layerGroupRef.current);
    }
  }, [renderLayers]);

  return (
    <div className="relative w-full h-full min-h-[560px] rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs bg-slate-100 flex flex-col cursor-crosshair">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" style={{ zIndex: 1 }} />

      {/* Floating HUD Controls Top Left */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-gray-200 shadow-xs text-xs font-semibold text-gray-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>BreatheWise Geospatial Radar</span>
        </div>
        <button
          onClick={recenter}
          className="p-2 rounded-full bg-white/95 backdrop-blur-md border border-gray-200 shadow-xs text-gray-700 hover:text-teal-600 hover:bg-white transition-all cursor-pointer"
          title="Recenter and Fit View"
          aria-label="Recenter Map"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Map Click Guidance Pill Top Right */}
      {(!origin || !destination) && (
        <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/85 backdrop-blur-md text-white text-[11px] font-medium shadow-md">
          <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
          <span>{!origin ? "Click map to set Origin (A)" : "Click map to set Destination (B)"}</span>
        </div>
      )}

      {/* Floating Route Legend Bottom Left */}
      {routes.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-md text-[11px] max-w-[calc(100%-80px)]">
          {routes.map((r) => {
            const isSelected = r.index === selectedRouteIndex;
            return (
              <button
                key={r.index}
                onClick={() => onSelectRoute(r.index)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-slate-900 text-white font-bold border-slate-900 shadow-xs"
                    : "text-gray-700 bg-gray-50/80 border-gray-200/80 hover:bg-gray-100"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: r.strokeColor,
                    boxShadow: isSelected ? `0 0 0 2px #fff` : undefined,
                  }}
                />
                <span className="truncate max-w-[130px]">{r.label}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {r.pollutionScore}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading Overlay */}
      {isPlanning && (
        <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/95 shadow-lg border border-gray-200 text-xs font-semibold text-gray-800">
            <span className="w-3 h-3 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
            <span>Calculating optimal air quality paths...</span>
          </div>
        </div>
      )}
    </div>
  );
}
