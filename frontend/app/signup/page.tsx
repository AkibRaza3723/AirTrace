"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthPage from "../auth/page";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth?mode=signup");
  }, [router]);

  return <AuthPage />;
}
