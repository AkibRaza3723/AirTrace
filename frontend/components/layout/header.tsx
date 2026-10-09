"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Wind, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/" },
  { label: "Exposure",      href: "/exposure" },
  { label: "Route Planner", href: "/route" },
  { label: "Campus Safety", href: "/schools" },
  { label: "Satellite",     href: "/hotspots" },
  { label: "AI Assistant",  href: "/assistant" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass-header border-b border-gray-200">
      <div className="h-16 w-full px-4 md:px-8 flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Wind className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900 group-hover:text-blue-700 transition-colors">
            AirTrace
          </span>
        </Link>

        {/* Desktop Nav */}
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

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live AQI badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-700">AQI 42</span>
            <span className="text-emerald-600 font-medium">Good</span>
          </div>

          {/* Location pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium">Brooklyn, NY</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full w-9 h-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </Button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            AT
          </div>
        </div>
      </div>

      {/* Mobile nav */}
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
    </header>
  );
}
