"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Lock, Loader2, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

const PUBLIC_ROUTES = ["/", "/auth", "/login", "/signup"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isOnboardingRoute = pathname === "/onboarding";

  useEffect(() => {
    if (isLoading) return;

    // 1. Logged out user visiting private route -> Redirect to login with returnTo
    if (!user?.isLoggedIn && !isPublicRoute) {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnTo=${returnUrl}`);
      return;
    }

    // 2. Logged in user visiting public auth routes (/login, /signup, /auth)
    if (user?.isLoggedIn && ["/login", "/signup", "/auth"].includes(pathname)) {
      if (user.profession === "STUDENT" && !user.onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
      return;
    }

    // 3. Student with incomplete onboarding visiting private route other than /onboarding
    if (
      user?.isLoggedIn &&
      user.profession === "STUDENT" &&
      !user.onboardingCompleted &&
      !isOnboardingRoute &&
      !isPublicRoute
    ) {
      router.replace("/onboarding");
      return;
    }
  }, [isLoading, user, pathname, isPublicRoute, isOnboardingRoute, router]);

  // Loading skeleton while verifying persistent session (prevents login flashes!)
  if (isLoading) {
    return (
      <div className="w-full flex-1 min-h-[65vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl gradient-primary text-white flex items-center justify-center mb-4 shadow-sm animate-pulse">
          <Wind className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>Verifying secure atmospheric session...</span>
        </div>
      </div>
    );
  }

  // Unauthorized screen while redirecting
  if (!user?.isLoggedIn && !isPublicRoute) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1.5">Authentication Required</h2>
        <p className="text-xs text-gray-500 max-w-sm mb-5">
          Access to this route requires an authenticated BreatheWise account. Redirecting to login...
        </p>
        <Button
          size="sm"
          onClick={() => router.push(`/login?returnTo=${encodeURIComponent(pathname)}`)}
          className="gradient-primary text-white text-xs font-semibold px-5 rounded-xl cursor-pointer"
        >
          Sign Up / Log In
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
