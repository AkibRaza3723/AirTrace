"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const PUBLIC_ROUTES = ["/", "/auth", "/login", "/signup"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthorized = isPublicRoute || Boolean(user?.isLoggedIn);

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.replace("/auth");
    }
  }, [isLoading, isAuthorized, pathname, router]);

  if (isLoading) {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1.5">Authentication Required</h2>
        <p className="text-xs text-gray-500 max-w-sm mb-5">
          Access to this route requires an academic or campus login. Redirecting to sign-in...
        </p>
        <Button
          size="sm"
          onClick={() => router.push("/auth")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 rounded-lg"
        >
          Sign Up / Log In
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
