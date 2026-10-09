"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/" },
  { label: "My Inhaled Dose", href: "/exposure" },
  { label: "Route Optimizer", href: "/route" },
  { label: "Campus Protocol", href: "/schools" },
  { label: "Satellite Intel", href: "/hotspots" },
  { label: "Air Assistant", href: "/assistant" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass-header border-b border-white/[0.06]">
      <div className="h-16 w-full px-6 md:px-10 flex items-center justify-between gap-4">
        {/* Brand & Location */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] font-bold group-hover:scale-105 transition-transform">
              🍃
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-[var(--primary-emerald)]">
              BreatheWise
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-container-high)]/70 hover:bg-[var(--surface-container-highest)] border border-white/[0.06] text-xs transition-colors cursor-pointer">
            <span className="text-[var(--on-surface-variant)] flex items-center gap-1 font-mono">
              <span className="text-[var(--primary)]">📍</span> Brooklyn, NY • Station EPA-402 (2m ago)
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="font-mono text-[var(--primary)] font-semibold">Live</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--on-surface-variant)]" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-[var(--surface-container-low)]/80 p-1 rounded-full border border-white/[0.06]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-[var(--primary-container)] text-[var(--on-primary-container)] font-semibold shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                    : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Status & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-container-high)]/80 border border-white/[0.06] shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping" />
            <span className="font-mono text-xs font-semibold text-[var(--on-surface)]">AQI 42</span>
            <span className="font-mono text-xs text-[var(--primary)]">• Crisp & Clean</span>
          </div>

          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full bg-[var(--surface-container-high)]/60 text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)] border border-white/[0.06] transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--secondary)] ring-2 ring-[var(--surface-dim)]" />
          </button>

          <div className="w-8 h-8 rounded-full ring-2 ring-[var(--primary)]/40 flex items-center justify-center bg-[var(--surface-container-high)] text-sm font-semibold text-[var(--primary)]">
            BW
          </div>
        </div>
      </div>
      {/* Mobile nav bar */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-white/[0.04] bg-[var(--surface-container-lowest)]/90">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap",
                isActive
                  ? "bg-[var(--primary-container)] text-[var(--on-primary-container)] font-semibold"
                  : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
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
