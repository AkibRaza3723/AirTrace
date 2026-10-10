"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthPage from "../auth/page";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const returnTo = searchParams.get("returnTo");
    const query = returnTo ? `?mode=login&returnTo=${encodeURIComponent(returnTo)}` : `?mode=login`;
    router.replace(`/auth${query}`);
  }, [router, searchParams]);

  return <AuthPage />;
}
