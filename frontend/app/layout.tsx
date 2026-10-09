import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/lib/auth-context";
import { RouteGuard } from "@/components/auth/route-guard";
import { OnboardingModal } from "@/components/auth/onboarding-modal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jetbrains",
  weight: ["400", "500", "600"],
});

// --font-headline alias → same as body for clean sans-serif uniformity
const fontHeadline = Inter({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AirTrace / BreatheWise — Actionable Air Intelligence",
  description:
    "Personal exposure tracking, pollution-aware routing, and grounded AI air assistance. Know what you breathe.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        inter.variable,
        fontHeadline.variable,
        jetbrainsMono.variable
      )}
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800 bg-[var(--background)] text-[var(--on-surface)]">
        <AuthProvider>
          <Header />
          <main className="w-full pt-24 lg:pt-16 flex-1 flex flex-col">
            <RouteGuard>{children}</RouteGuard>
          </main>
          <Footer />
          <OnboardingModal />
        </AuthProvider>
      </body>
    </html>
  );
}
