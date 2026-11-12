"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem("ielts-nova:splash-seen", "true");
    } catch {}
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("ielts-nova:splash-seen")) {
        onComplete?.();
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get("auth") === "required") {
        sessionStorage.setItem("ielts-nova:splash-seen", "true");
        onComplete?.();
        return;
      }
    } catch {
      /* ignore storage errors */
    }

    setVisible(true);
    const timer = setTimeout(() => {
      dismiss();
    }, 750);

    return () => clearTimeout(timer);
  }, [dismiss, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="ielts-nova-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={dismiss}
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#070D12] px-6 text-white select-none cursor-pointer"
        >
          {/* Ambient Midnight Emerald Radial Glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
          <div className="pointer-events-none absolute h-80 w-80 rounded-full bg-emerald-500/15 blur-[96px]" />

          {/* Centered Brand Logo Card (opacity-0 scale-95 -> opacity-100 scale-100 in 180ms) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#020503] shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <Image
                src="/logo.png"
                alt="IELTS Nova"
                width={380}
                height={214}
                priority
                className="h-auto w-[280px] sm:w-[360px] object-contain"
              />
            </div>

            <div className="mt-5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-400/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>RASMIY CAMBRIDGE CDI SUITE</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
