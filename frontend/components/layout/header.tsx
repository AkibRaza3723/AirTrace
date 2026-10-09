"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wind, LogOut, ChevronDown, UserCircle2, Building2,
  ShieldCheck, KeyRound, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/dashboard" },
  { label: "Exposure",      href: "/exposure" },
  { label: "Route Planner", href: "/route" },
  { label: "Campus Safety", href: "/schools" },
  { label: "AI Assistant",  href: "/assistant" },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="fixed top-0 inset-x-0 z-50 glass-header border-b border-gray-200">
      <div className="h-16 w-full px-4 md:px-8 flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">

        {/* Brand Logo */}
        <Link href={user?.isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Wind className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900 group-hover:text-blue-700 transition-colors">
            AirTrace
          </span>
        </Link>

        {/* Desktop Nav - only visible when logged in */}
        {user?.isLoggedIn && (
          <nav className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "nav-pill-active"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live AQI badge - only visible when logged in */}
          {user?.isLoggedIn && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-emerald-700">AQI 42</span>
              <span className="text-emerald-600 font-medium">Good</span>
            </div>
          )}

          {user?.isLoggedIn ? (
            /* User Avatar & Dropdown Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-100/80 transition-colors cursor-pointer group"
                aria-expanded={dropdownOpen}
              >
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-tight">
                    {user.role}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-transparent group-hover:ring-blue-400/40 transition-all">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", dropdownOpen && "rotate-180")} />
              </button>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-up">
                  
                  {/* User Profile Header in Dropdown */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-xs truncate">{user.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Institution Details */}
                  <div className="px-4 py-2.5 space-y-1.5 text-xs text-gray-600 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-medium truncate">{user.college}</span>
                    </div>
                    {user.studentId && (
                      <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                        <UserCircle2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>ID: <strong className="font-mono text-gray-700">{user.studentId}</strong></span>
                      </div>
                    )}
                    {user.deanAuthId && (
                      <div className="flex items-center gap-2 text-[11px] text-emerald-700">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Dean Code: <strong className="font-mono">{user.deanAuthId}</strong></span>
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
                    <Link
                      href="/exposure"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Exposure Assessment
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
            <Link href="/auth">
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-4 py-2"
              >
                Sign Up / Log In
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav - only visible when logged in */}
      {user?.isLoggedIn && (
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2 border-t border-gray-100 bg-white/95">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
