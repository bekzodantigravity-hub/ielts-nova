"use client";

import { SplashScreen } from "./splash-screen";

interface SiteEntranceProps {
  onComplete?: () => void;
  lang?: "uz" | "ru" | "en";
}

export function SiteEntrance({ onComplete }: SiteEntranceProps) {
  return <SplashScreen onComplete={onComplete} />;
}
