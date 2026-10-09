"use client";

import { DashboardView } from "@/components/home/dashboard-view";

export default function DashboardPage() {
  return (
    <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      <DashboardView />
    </div>
  );
}
