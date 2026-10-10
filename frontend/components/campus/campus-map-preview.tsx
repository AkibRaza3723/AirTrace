"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CampusMapPreviewProps {
  lat: number;
  lng: number;
  campusName: string;
}

export function CampusMapPreview({ lat, lng, campusName }: CampusMapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      // Custom pulsing blue marker
      const customIcon = L.divIcon({
        className: "custom-campus-pin",
        html: `
          <div style="
            background: #2563eb;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(37,99,235,0.4);
            border: 2px solid white;
            font-size: 14px;
          ">
            🎓
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`<strong>${campusName}</strong><br/>${lat.toFixed(4)}, ${lng.toFixed(4)}`);

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setView([lat, lng], 14);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setPopupContent(
          `<strong>${campusName}</strong><br/>${lat.toFixed(4)}, ${lng.toFixed(4)}`
        );
      }
    }

    return () => {
      // Keep map across re-renders
    };
  }, [lat, lng, campusName]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-48 sm:h-56 bg-slate-100 relative z-0"
    />
  );
}
