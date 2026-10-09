import { Wind } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md gradient-primary flex items-center justify-center">
            <Wind className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-gray-700">AirTrace</span>
          <span className="text-gray-300">|</span>
          <span>Personal Air Exposure Intelligence</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-emerald-600">Live Telemetry</span>
          </div>
          <span className="text-gray-300">•</span>
          <span>OpenAQ + Sentinel-5P</span>
          <span className="text-gray-300">•</span>
          <span className="font-medium text-gray-600">v2.4</span>
        </div>
      </div>
    </footer>
  );
}
