"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  GraduationCap,
  Building,
  MapPin,
  CheckCircle2,
  Search,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Compass,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

// Dynamic map preview to prevent SSR Leaflet errors
const CampusMapPreview = dynamic(
  () =>
    import("@/components/campus/campus-map-preview").then(
      (mod) => mod.CampusMapPreview
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 rounded-2xl bg-gray-100 flex items-center justify-center text-xs text-gray-400">
        Loading Campus Satellite View...
      </div>
    ),
  }
);

interface GeocodePlace {
  name: string;
  lat: number;
  lng: number;
  formatted?: string;
}

export default function StudentOnboardingPage() {
  const router = useRouter();
  const { user, isLoading, updateCampusProfile } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  const [campusName, setCampusName] = useState(
    user?.campusProfile?.campusName || "Indian Institute of Technology Delhi"
  );
  const [campusLat, setCampusLat] = useState<number>(
    user?.campusProfile?.campusLatitude || 28.545
  );
  const [campusLng, setCampusLng] = useState<number>(
    user?.campusProfile?.campusLongitude || 77.1926
  );
  const [campusAddress, setCampusAddress] = useState<string>(
    user?.campusProfile?.campusAddress || "Hauz Khas, New Delhi, Delhi 110016"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodePlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync user's campus if available
  useEffect(() => {
    if (user?.campusProfile) {
      setCampusName(user.campusProfile.campusName);
      setCampusLat(user.campusProfile.campusLatitude);
      setCampusLng(user.campusProfile.campusLongitude);
      if (user.campusProfile.campusAddress) {
        setCampusAddress(user.campusProfile.campusAddress);
      }
    }
  }, [user]);

  // If user is a professional or not logged in, redirect
  useEffect(() => {
    if (!isLoading) {
      if (!user?.isLoggedIn) {
        router.replace("/auth");
      } else if (user.profession === "PROFESSIONAL") {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, user, router]);

  // Autocomplete search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${apiUrl}/api/routes/geocode?q=${encodeURIComponent(searchQuery)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.places || []);
        }
      } catch {
        // Silently catch geocode errors
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, apiUrl]);

  const handleConfirm = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await updateCampusProfile({
        campusName,
        campusLatitude: campusLat,
        campusLongitude: campusLng,
        campusAddress,
      });

      if (res.success) {
        router.push(res.redirectTo || "/dashboard");
      } else {
        setError(res.error || "Failed to confirm campus setup. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-xs text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-600" />
        Loading student onboarding...
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50/50">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-gray-200/90 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              🎓
            </span>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold">
              Student Onboarding Setup
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Confirm Your Campus Location
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            BreatheWise uses your campus coordinates to deliver real-time CPCB telemetry, sports air safety alerts, and pollution forecasts.
          </p>
        </div>

        {error && (
          <div className="mx-6 sm:mx-8 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-4">
          
          {/* Campus Details Card */}
          <div className="p-4 rounded-2xl border border-gray-200/90 bg-gray-50/60 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Assigned Institution
                </span>
                <h3 className="text-base font-extrabold text-gray-900 mt-0.5">
                  {campusName}
                </h3>
                {campusAddress && (
                  <p className="text-xs text-gray-500 mt-0.5">{campusAddress}</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs h-8 px-2.5 rounded-lg border-gray-200 text-gray-700 bg-white hover:bg-gray-100 cursor-pointer"
              >
                <Edit2 className="w-3 h-3 mr-1 text-blue-600" />
                {isEditing ? "Close Edit" : "Change Campus"}
              </Button>
            </div>

            {/* Read-Only Coordinates Badges */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/80">
              <div className="p-2 rounded-xl bg-white border border-gray-200/80">
                <span className="text-[10px] text-gray-400 font-semibold block">Latitude</span>
                <span className="text-xs font-mono font-bold text-gray-900">
                  {campusLat.toFixed(5)}° N
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-gray-200/80">
                <span className="text-[10px] text-gray-400 font-semibold block">Longitude</span>
                <span className="text-xs font-mono font-bold text-gray-900">
                  {campusLng.toFixed(5)}° E
                </span>
              </div>
            </div>
          </div>

          {/* Edit Campus Search Input */}
          {isEditing && (
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3 animate-in fade-in-50">
              <div>
                <Label className="text-xs font-semibold text-gray-700">Institution Name</Label>
                <Input
                  value={campusName}
                  onChange={(e) => setCampusName(e.target.value)}
                  placeholder="e.g. BITS Pilani or IIT Bombay"
                  className="mt-1 text-xs h-9 bg-white"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">
                  Search Location / Address
                </Label>
                <div className="relative mt-1">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search campus city or locality..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs h-9 bg-white pl-8 pr-8"
                  />
                  {searching && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-1.5 max-h-40 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-md divide-y divide-gray-100">
                    {searchResults.map((place, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCampusLat(place.lat);
                          setCampusLng(place.lng);
                          setCampusAddress(place.formatted || place.name);
                          setSearchResults([]);
                          setSearchQuery("");
                          setIsEditing(false);
                        }}
                        className="w-full text-left p-2 hover:bg-blue-50 text-xs flex items-start gap-2 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-gray-900 block">{place.name}</span>
                          {place.formatted && (
                            <span className="text-[10px] text-gray-400 line-clamp-1">
                              {place.formatted}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Map Preview */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
            <CampusMapPreview lat={campusLat} lng={campusLng} campusName={campusName} />
          </div>

          {/* Confirmation Action */}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="w-full h-11 gradient-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs gap-2 cursor-pointer mt-2 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Campus Profile...
              </>
            ) : (
              <>
                Confirm Campus & Enter Dashboard <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-[10px] text-center text-gray-400">
            You can always update your campus coordinates later from your account settings.
          </p>
        </div>

      </div>
    </div>
  );
}
