"use client";

import { useState, useEffect, useCallback } from "react";

export interface AirTelemetryData {
  location: { lat: number; lng: number };
  aqi: number;
  status: string;
  statusColor: string;
  headline: string;
  subtext: string;
  prominentPollutant?: string;
  standard?: string;
  subIndices?: Record<string, any>;
  pm25: number;
  pm10: number;
  o3: number;
  no2?: number;
  so2?: number;
  co?: number;
  nh3?: number;
  pb?: number;
  temp: string;
  humidity: string;
  wind: string;
  uv: string;
  forecast?: Array<{
    time: string;
    aqi: number;
    label: string;
    color: string;
  }>;
  updatedAt: string;
  source: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export function useAirTelemetry() {
  const [telemetry, setTelemetry] = useState<AirTelemetryData | null>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 28.6139,
    lng: 77.209,
  });
  const [isUsingLiveLocation, setIsUsingLiveLocation] = useState<boolean>(false);

  const fetchStations = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/aqi/stations`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setStations(json.data);
    } catch (e) {
      console.warn("Failed to fetch Delhi stations:", e);
    }
  }, []);

  const fetchTelemetry = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${BACKEND_URL}/api/aqi/live?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);

      const json = await res.json();
      if (json.success && json.data) {
        setTelemetry(json.data);
      } else {
        throw new Error(json.error || "Failed to load telemetry");
      }
    } catch (err: any) {
      console.warn("Failed to fetch live air telemetry from backend:", err.message);
      setError(err.message || "Could not retrieve air quality telemetry");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    fetchStations();
    if (typeof window === "undefined" || !navigator.geolocation) {
      fetchTelemetry(coords.lat, coords.lng);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setIsUsingLiveLocation(true);
        fetchTelemetry(latitude, longitude);
      },
      () => {
        setIsUsingLiveLocation(false);
        fetchTelemetry(coords.lat, coords.lng);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [coords.lat, coords.lng, fetchTelemetry, fetchStations]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    telemetry,
    stations,
    loading,
    error,
    coords,
    isUsingLiveLocation,
    refetch: () => {
      fetchTelemetry(coords.lat, coords.lng);
      fetchStations();
    },
    requestLocation,
    fetchByCoords: fetchTelemetry,
  };
}
