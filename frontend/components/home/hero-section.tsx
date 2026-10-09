"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wind, ShieldCheck, Route, Activity, Sparkles,
  ArrowRight, CheckCircle2, ChevronRight, BarChart3,
  Layers, School, Lock, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function HeroSection() {
  const router = useRouter();
  const { user, demoLogin } = useAuth();

  const handleDemo = () => {
    demoLogin();
    router.push("/dashboard");
  };

  return (
    <div className="w-full flex flex-col gap-12 pb-12">
      
      {/* Top Banner / Announcement */}
      <div className="flex justify-center pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-xs text-blue-800 shadow-sm animate-fade-up">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-semibold">BreatheWise Environmental Track 2026</span>
          <span className="text-gray-400">|</span>
          <span className="text-blue-600 flex items-center gap-1 font-medium">
            OpenAQ + NASA Satellite Ingestion <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Hero Headline & CTA */}
      <div className="max-w-4xl mx-auto text-center space-y-6 px-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
          Actionable Air Intelligence,{" "}
          <span className="gradient-text-primary">Not Just City Averages.</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          AirTrace translates atmospheric telemetry into quantifiable personal intake reduction, pollution-aware clean routing, and institutional campus safety modes.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {user?.isLoggedIn ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="rounded-xl px-8 py-6 text-sm sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-200" />
                Open Live Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="rounded-xl px-7 py-6 text-sm sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all gap-2 group"
                >
                  <Sparkles className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
                  Sign Up & Verify Access
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                onClick={handleDemo}
                className="rounded-xl px-6 py-6 text-sm sm:text-base font-semibold border-gray-300 hover:bg-gray-100/80 text-gray-700 transition-all gap-2"
              >
                Explore Live Demo <ChevronRight className="w-4 h-4 text-gray-400" />
              </Button>
            </>
          )}
        </div>

        {/* Quick Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Verified Campus Role Access
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            WHO-Calibrated Respiration Math
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Real-time Station Ground Truth
          </span>
        </div>
      </div>

      {/* Animated Telemetry & Feature Showcase */}
      <div className="max-w-5xl mx-auto w-full px-4">
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white/90 to-gray-50/90 border border-gray-200/90 shadow-2xl backdrop-blur-md overflow-hidden">
          
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            
            {/* Feature 1: Exposure Engine */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Personal Exposure Engine</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Calculates real inhaled particulate load based on commute duration, respiration rate, and micro-environment factors.
              </p>
              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100/80 text-[11px] font-mono text-blue-800">
                Intake = (PM2.5/25) × Hours × F_mode
              </div>
            </div>

            {/* Feature 2: Clean Routing */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Route className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Pollution-Aware Routing</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Compares travel time against cumulative exposure: Fastest vs. Lowest Exposure vs. Balanced compromise paths.
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100/80 text-[11px] font-medium text-emerald-800 flex items-center justify-between">
                <span>Route B Exposure:</span>
                <span className="font-bold text-emerald-600">-28% PM2.5 Intake</span>
              </div>
            </div>

            {/* Feature 3: Campus & Institutional Protocol */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <School className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Institutional Safety Mode</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Automated rule engine for schools, universities, and colleges: athletic safety, indoor ventilation, and PE protocols.
              </p>
              <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100/80 text-[11px] font-medium text-amber-800 flex items-center justify-between">
                <span>Campus Air Status:</span>
                <span className="font-bold text-amber-600">Indoor PE Shift</span>
              </div>
            </div>

          </div>

          {/* Bottom Interactive Trigger Banner */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-gray-900">Sign Up Required to Unlock Full Telemetry & Alerts</span>
                <div className="text-gray-500">Provide your college ID to access student & faculty dashboard tools</div>
              </div>
            </div>

            <Link href="/auth">
              <Button
                size="sm"
                className="bg-gray-900 hover:bg-black text-white text-xs font-semibold px-5 rounded-lg shrink-0"
              >
                Sign Up Now
              </Button>
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
