"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wind, LogOut, ChevronDown, ChevronRight, Building2,
  Sparkles, Menu, X, LayoutDashboard, Route as RouteIcon,
  ShieldCheck, Bot, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useAirTelemetry } from "@/hooks/use-air-telemetry";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/dashboard", icon: LayoutDashboard, desc: "Live CPCB AQI & Personal Exposure" },
  { label: "Route Planner", href: "/route",     icon: RouteIcon,       desc: "Pollution-Aware Clean Corridors" },
  { label: "Campus Safety", href: "/schools",   icon: ShieldCheck,     desc: "Collegiate & School Sports Clearance" },
  { label: "AI Assistant",  href: "/assistant", icon: Bot,             desc: "Grounded Bedrock Air Copilot" },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { telemetry } = useAirTelemetry();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on path change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock background scroll when slider is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close slider on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 glass-header border-b border-gray-200 w-full">
        <div className="h-16 w-full px-3 sm:px-6 md:px-8 flex items-center justify-between gap-3 max-w-screen-2xl mx-auto">

        {/* Brand Logo */}
        <Link href={user?.isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Wind className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-gray-900 group-hover:text-blue-700 transition-colors">
            AirTrace
          </span>
        </Link>

        {/* Desktop Nav - only visible when logged in */}
        {user?.isLoggedIn && (
          <nav className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                    isActive
                      ? "nav-pill-active"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live CPCB NAQI badge - visible on desktop and compact on mobile */}
          {user?.isLoggedIn && (
            <div
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold",
                telemetry && telemetry.aqi <= 50
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : telemetry && telemetry.aqi <= 100
                  ? "bg-green-50 border-green-200 text-green-800"
                  : telemetry && telemetry.aqi <= 200
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : telemetry && telemetry.aqi <= 300
                  ? "bg-orange-50 border-orange-200 text-orange-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              )}
            >
            </div>
          )}

          {user?.isLoggedIn ? (
            /* User Avatar & Dropdown Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100/80 transition-colors cursor-pointer group"
                aria-expanded={dropdownOpen}
                aria-label="User profile menu"
              >
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-tight font-medium">
                    {user.profession === "STUDENT" ? "🎓 Student" : "💼 Professional"}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xs font-bold text-white shadow-xs ring-2 ring-transparent group-hover:ring-blue-400/40 transition-all">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform hidden sm:block", dropdownOpen && "rotate-180")} />
              </button>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-up">
                  
                  {/* User Profile Header in Dropdown */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-xs truncate">{user.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700">
                          {user.profession === "STUDENT" ? "🎓 STUDENT" : "💼 PROFESSIONAL"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Institution Details or Professional Location */}
                  <div className="px-4 py-2.5 space-y-1.5 text-xs text-gray-600 border-b border-gray-100">
                    {user.profession === "STUDENT" ? (
                      <>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold truncate">{user.campusProfile?.campusName || user.college}</span>
                        </div>
                        {user.campusProfile && (
                          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>
                              {user.campusProfile.campusLatitude.toFixed(3)}°N, {user.campusProfile.campusLongitude.toFixed(3)}°E
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="text-xs">📍</span>
                        <span className="font-medium truncate">
                          {user.preferredAddress || "City Workspace (No location set)"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Navigation Links inside Dropdown */}
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Dashboard
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 my-1" />

                  {/* Log Out Button */}
                  <div className="px-2 pt-1 pb-0.5">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth?mode=login" className="hidden sm:inline-block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs font-semibold text-gray-700 hover:text-gray-900"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/auth?mode=signup">
                <Button
                  size="sm"
                  className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-3.5 py-1.5"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle (for all devices < lg) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl text-gray-700 hover:text-gray-950 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>

      {/* ─── Mobile Slide-out Drawer / Slider ──────────────────────── */}
      {/* Darkened Backdrop Overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-xs transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Sheet Drawer (Slider) */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 right-0 z-[9999] w-80 max-w-[85vw] h-full h-[100dvh] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-100",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Mobile Navigation Drawer"
      >
        {/* Slider Header */}
        <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white shadow-xs">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-gray-900 tracking-tight">AirTrace</span>
              <span className="text-[10px] text-gray-400 block font-medium">Navigation Menu</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-9 h-9 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-200/60 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slider Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* User Profile Tile or Guest Welcome Card */}
          {user?.isLoggedIn ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border border-blue-100/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-xs truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 shrink-0">
                  {user.profession === "STUDENT" ? "🎓 Student" : "💼 Pro"}
                </span>
              </div>

              {/* Institution or Address */}
              <div className="pt-2 border-t border-blue-100/60 flex items-center gap-1.5 text-[11px] text-gray-600 truncate">
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">
                  {user.profession === "STUDENT"
                    ? user.campusProfile?.campusName || user.college || "Campus not configured"
                    : user.preferredAddress || "City Workspace"}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white mx-auto shadow-xs">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Welcome to AirTrace</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Personalized air exposure telemetry, safe routes & campus alerts.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/auth?mode=login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-xl">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Live AQI Telemetry Quick Card in Slider */}
          {telemetry && (
            <div className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">
                  Live Air Status
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="font-mono text-xl font-black text-amber-400">{telemetry.aqi}</span>
                  <span className="text-[10px] text-slate-300 font-medium">({telemetry.status})</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">
                  PM2.5 Sensor
                </span>
                <span className="font-mono text-xs font-bold text-rose-400">
                  {telemetry.pm25} µg/m³
                </span>
              </div>
            </div>
          )}

          {/* Navigation Tabs (Shifted into slider) */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-2">
              Navigation Tabs
            </span>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer group",
                    isActive
                      ? "bg-blue-600 text-white font-bold shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 font-semibold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm leading-tight">{item.label}</p>
                      <p
                        className={cn(
                          "text-[10px] leading-tight mt-0.5",
                          isActive ? "text-blue-100 font-normal" : "text-gray-400 font-normal"
                        )}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-transform group-hover:translate-x-0.5",
                      isActive ? "text-white" : "text-gray-400"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Slider Footer */}
        {user?.isLoggedIn && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200/80 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of AirTrace</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
