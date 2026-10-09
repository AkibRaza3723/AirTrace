"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { HeroSection } from "@/components/home/hero-section";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (!isLoading && user?.isLoggedIn) {
    return null;
  }

  return (
    <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      <HeroSection />
    </div>
  );
}
