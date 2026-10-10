"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Wind,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Building,
  Navigation,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, ProfessionType } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface GeocodeItem {
  name: string;
  lat: number;
  lng: number;
  formatted?: string;
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, login, signup } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  const [authMode, setAuthMode] = useState<"login" | "signup">(initialMode);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form submitting states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profession, setProfession] = useState<ProfessionType>("STUDENT");

  // Student specific campus state
  const [campusName, setCampusName] = useState("");
  const [campusSearchQuery, setCampusSearchQuery] = useState("");
  const [campusSearchResults, setCampusSearchResults] = useState<GeocodeItem[]>([]);
  const [isSearchingCampus, setIsSearchingCampus] = useState(false);
  const [selectedCampusLocation, setSelectedCampusLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  // Professional specific state
  const [enablePreferredLocation, setEnablePreferredLocation] = useState(false);
  const [proSearchQuery, setProSearchQuery] = useState("");
  const [proSearchResults, setProSearchResults] = useState<GeocodeItem[]>([]);
  const [isSearchingPro, setIsSearchingPro] = useState(false);
  const [selectedProLocation, setSelectedProLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user?.isLoggedIn) {
      if (user.profession === "STUDENT" && !user.onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        router.replace(returnTo);
      }
    }
  }, [isLoading, user, router, returnTo]);

  // Geocode search for Student campus location
  useEffect(() => {
    if (!campusSearchQuery || campusSearchQuery.trim().length < 3) {
      setCampusSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCampus(true);
      try {
        const res = await fetch(
          `${apiUrl}/api/routes/geocode?q=${encodeURIComponent(campusSearchQuery)}`
        );
        if (res.ok) {
          const data = await res.json();
          setCampusSearchResults(data.places || []);
      } catch {
        // Silently catch geocode errors
      } finally {
        setIsSearchingCampus(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [campusSearchQuery, apiUrl]);

  // Geocode search for Professional location
  useEffect(() => {
    if (!proSearchQuery || proSearchQuery.trim().length < 3) {
      setProSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPro(true);
      try {
        const res = await fetch(
          `${apiUrl}/api/routes/geocode?q=${encodeURIComponent(proSearchQuery)}`
        );
        if (res.ok) {
          const data = await res.json();
          setProSearchResults(data.places || []);
        }
      } catch {
        // Silently catch geocode errors
      } finally {
        setIsSearchingPro(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [proSearchQuery, apiUrl]);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (res.success) {
        setSuccessMessage("Logged in successfully! Redirecting...");
        const target = res.redirectTo || returnTo;
        setTimeout(() => router.push(target), 400);
      } else {
        setErrorMessage(res.error || "Login failed. Please check credentials.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Signup submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage("Please enter your full name (minimum 2 characters).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setErrorMessage("Password must contain at least one letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    // Student checks
    let finalLat: number | undefined = selectedCampusLocation?.lat;
    let finalLng: number | undefined = selectedCampusLocation?.lng;
    let finalAddress: string | undefined = selectedCampusLocation?.address;

    if (profession === "STUDENT") {
      if (!campusName.trim()) {
        setErrorMessage("Please enter your campus or university name.");
        return;
      }

      if (showManualCoords) {
        const parsedLat = parseFloat(manualLat);
        const parsedLng = parseFloat(manualLng);
        if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
          setErrorMessage("Manual latitude must be a valid number between -90 and 90.");
          return;
        }
        if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
          setErrorMessage("Manual longitude must be a valid number between -180 and 180.");
          return;
        }
        finalLat = parsedLat;
        finalLng = parsedLng;
      }

      if (finalLat === undefined || finalLng === undefined) {
        setErrorMessage(
          "Please select your campus location using the institution search or map picker."
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await signup({
        fullName: fullName.trim(),
        email: signupEmail.trim(),
        password,
        confirmPassword,
        profession,
        campusName: profession === "STUDENT" ? campusName.trim() : undefined,
        campusLatitude: profession === "STUDENT" ? finalLat : undefined,
        campusLongitude: profession === "STUDENT" ? finalLng : undefined,
        campusAddress: profession === "STUDENT" ? finalAddress : undefined,
        preferredAddress:
          profession === "PROFESSIONAL" && enablePreferredLocation
            ? selectedProLocation?.address
            : undefined,
        preferredLat:
          profession === "PROFESSIONAL" && enablePreferredLocation
            ? selectedProLocation?.lat
            : undefined,
        preferredLng:
          profession === "PROFESSIONAL" && enablePreferredLocation
            ? selectedProLocation?.lng
            : undefined,
      });

      if (res.success) {
        setSuccessMessage("Account created successfully! Preparing platform...");
        const target = res.redirectTo || (profession === "STUDENT" ? "/onboarding" : returnTo);
        setTimeout(() => router.push(target), 400);
      } else {
        setErrorMessage(res.error || "Failed to create account. Please check your details.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-radial from-blue-50/50 via-slate-50/30 to-white">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-gray-200/90 overflow-hidden flex flex-col">
        
        {/* Brand & Tabs Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-xs">
                <Wind className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-gray-900 tracking-tight">
                BreatheWise
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/70 text-blue-800 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Secure Portal
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mt-6 flex bg-gray-200/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                authMode === "login"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <LogIn className="w-4 h-4 text-blue-600" />
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                authMode === "signup"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              Create Account
            </button>
          </div>

          {/* Subtitle */}
          <div className="mt-4">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {authMode === "login" ? "Welcome Back to BreatheWise" : "Join the Clean Air Network"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {authMode === "login"
                ? "Enter your credentials to access live telemetry, clean routes, and campus alerts."
                : "Register as a Student or Professional to customize personalized air intelligence."}
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mx-6 sm:mx-8 mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 sm:mx-8 mt-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="font-medium">{successMessage}</div>
          </div>
        )}

        {/* ─── LOGIN FORM ────────────────────────────────────────────── */}
        {authMode === "login" && (
          <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@campus.edu or you@work.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="mt-1 text-sm h-10 bg-gray-50/60 rounded-xl"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700">Password</Label>
              </div>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="text-sm h-10 bg-gray-50/60 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 gradient-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  Log In to Dashboard <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* ─── SIGNUP FORM ───────────────────────────────────────────── */}
        {authMode === "signup" && (
          <form onSubmit={handleSignup} className="p-6 sm:p-8 space-y-4">
            
            {/* Full Name */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">Full Name</Label>
              <Input
                required
                placeholder="e.g. Omkar Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 text-sm h-10 bg-gray-50/60 rounded-xl"
              />
            </div>

            {/* Email */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="e.g. omkar@iitd.ac.in or omkar@company.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="mt-1 text-sm h-10 bg-gray-50/60 rounded-xl"
              />
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-700">Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Min 8 chars, 1 letter, 1 number"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-xs h-10 bg-gray-50/60 rounded-xl pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">Confirm Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-xs h-10 bg-gray-50/60 rounded-xl pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Profession Selection */}
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Select Your Profession
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProfession("STUDENT");
                    setErrorMessage(null);
                  }}
                  className={cn(
                    "p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer",
                    profession === "STUDENT"
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-xs"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    {profession === "STUDENT" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-gray-900">Student</span>
                    <span className="text-[10px] text-gray-500 leading-tight">
                      Campus mode, assembly safety, collegiate PE guidance
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfession("PROFESSIONAL");
                    // Clear student campus fields
                    setCampusName("");
                    setSelectedCampusLocation(null);
                    setCampusSearchQuery("");
                    setErrorMessage(null);
                  }}
                  className={cn(
                    "p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer",
                    profession === "PROFESSIONAL"
                      ? "border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20 shadow-xs"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    {profession === "PROFESSIONAL" && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-gray-900">Professional</span>
                    <span className="text-[10px] text-gray-500 leading-tight">
                      Commute exposure scores, low-pollution routes, city analytics
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* ─── STUDENT SPECIFIC FIELDS ──────────────────────────────── */}
            {profession === "STUDENT" && (
              <div className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/30 space-y-3 animate-in fade-in-50">
                <div className="flex items-center gap-1.5 text-blue-900">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-extrabold">Student Campus Profile</span>
                </div>

                {/* Campus Name */}
                <div>
                  <Label className="text-[11px] font-semibold text-gray-700">
                    College / University Name *
                  </Label>
                  <Input
                    required
                    placeholder="e.g. Indian Institute of Technology Delhi (IIT Delhi)"
                    value={campusName}
                    onChange={(e) => setCampusName(e.target.value)}
                    className="mt-1 text-xs h-9 bg-white rounded-xl"
                  />
                </div>

                {/* Campus Location Search */}
                <div>
                  <Label className="text-[11px] font-semibold text-gray-700">
                    Search Campus Geographical Location *
                  </Label>
                  <div className="relative mt-1">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Type institution or campus locality (e.g. Hauz Khas, Delhi)"
                      value={campusSearchQuery}
                      onChange={(e) => setCampusSearchQuery(e.target.value)}
                      className="text-xs h-9 bg-white rounded-xl pl-8 pr-8"
                    />
                    {isSearchingCampus && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Autocomplete Search Dropdown */}
                  {campusSearchResults.length > 0 && (
                    <div className="mt-1.5 max-h-40 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-md divide-y divide-gray-100 z-20">
                      {campusSearchResults.map((place, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedCampusLocation({
                              lat: place.lat,
                              lng: place.lng,
                              address: place.formatted || place.name,
                            });
                            if (!campusName) setCampusName(place.name.split(",")[0]);
                            setCampusSearchResults([]);
                            setCampusSearchQuery(place.formatted || place.name);
                          }}
                          className="w-full text-left p-2 hover:bg-blue-50 text-xs flex items-start gap-2 cursor-pointer transition-colors"
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

                  {/* Selected Location Pill */}
                  {selectedCampusLocation && (
                    <div className="mt-2 p-2.5 rounded-xl bg-white border border-emerald-300 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-gray-900 text-xs block">
                            Campus Location Linked
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700">
                            {selectedCampusLocation.lat.toFixed(4)}°N, {selectedCampusLocation.lng.toFixed(4)}°E
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                        Verified Pin
                      </Badge>
                    </div>
                  )}

                  {/* Advanced Manual Coordinates Toggle */}
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowManualCoords(!showManualCoords)}
                      className="text-[10px] text-blue-600 hover:underline cursor-pointer font-medium"
                    >
                      {showManualCoords ? "Hide manual coordinates" : "Enter coordinates manually (Advanced)"}
                    </button>
                  </div>

                  {showManualCoords && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-blue-200/60">
                      <div>
                        <Label className="text-[10px] text-gray-600">Latitude (-90 to 90)</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g. 28.5450"
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          className="text-xs h-7 bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-600">Longitude (-180 to 180)</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g. 77.1926"
                          value={manualLng}
                          onChange={(e) => setManualLng(e.target.value)}
                          className="text-xs h-7 bg-white mt-0.5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── PROFESSIONAL SPECIFIC FIELDS (OPTIONAL) ──────────────── */}
            {profession === "PROFESSIONAL" && (
              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-2.5 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-800">
                    <Navigation className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-bold">Set Preferred City Location (Optional)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePreferredLocation}
                    onChange={(e) => setEnablePreferredLocation(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  Optionally configure a home base or office location for daily commute exposure and dashboard weather.
                </p>

                {enablePreferredLocation && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        placeholder="Search home/office locality..."
                        value={proSearchQuery}
                        onChange={(e) => setProSearchQuery(e.target.value)}
                        className="text-xs h-8 bg-white rounded-lg pl-8 pr-8"
                      />
                      {isSearchingPro && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {proSearchResults.length > 0 && (
                      <div className="mt-1.5 max-h-36 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-md divide-y divide-gray-100">
                        {proSearchResults.map((place, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedProLocation({
                                lat: place.lat,
                                lng: place.lng,
                                address: place.formatted || place.name,
                              });
                              setProSearchResults([]);
                              setProSearchQuery(place.formatted || place.name);
                            }}
                            className="w-full text-left p-2 hover:bg-purple-50 text-xs flex items-start gap-2 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
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

                    {selectedProLocation && (
                      <div className="mt-2 text-[11px] text-purple-800 bg-purple-50 p-2 rounded-lg border border-purple-200 flex items-center justify-between">
                        <span className="truncate">{selectedProLocation.address}</span>
                        <span className="font-mono font-bold shrink-0 ml-2">
                          {selectedProLocation.lat.toFixed(3)}, {selectedProLocation.lng.toFixed(3)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 gradient-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  Create Account & Get Started <Sparkles className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-gray-400">Loading authentication...</div>}>
      <AuthContent />
    </Suspense>
  );
}
