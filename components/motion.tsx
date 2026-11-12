"use client";

import {
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export const SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 340,
  damping: 27,
  mass: 0.82,
};

export const SPRING_FLUID = {
  type: "spring" as const,
  stiffness: 230,
  damping: 25,
  mass: 0.88,
};

export const SPRING_TACTILE = {
  type: "spring" as const,
  stiffness: 440,
  damping: 26,
  mass: 0.68,
};

/**
 * Top fixed scroll progress indicator (smooth spring-coupled emerald trace)
 */
export function ScrollProgressBar({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className={cn(
        "pointer-events-none fixed top-0 right-0 left-0 z-50 h-[2.5px] bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400",
        className
      )}
    />
  );
}

/**
 * Masked word-by-word spring entrance for executive headlines
 */
export function AnimatedWords({
  text,
  className,
  delay = 0.04,
  stagger = 0.02,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const words = text.split(" ").filter(Boolean);
  return (
    <span className={cn("inline-flex flex-wrap justify-center gap-x-[0.26em]", className)}>
      {words.map((word, idx) => (
        <span key={`${word}-${idx}`} className="inline-block overflow-hidden py-0.5">
          <motion.span
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{
              duration: 0.15,
              ease: "easeOut",
              delay: delay + idx * stagger,
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/**
 * Tactile interactive button with iOS/Stripe spring press
 */
export function TactileButton({
  children,
  className,
  sheen = true,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { sheen?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer transition-all duration-150 active:scale-[0.99]",
        sheen && "btn-sheen",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageRouteTransition({
  routeKey,
  children,
}: {
  routeKey: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, filter: "blur(5px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale";
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.15,
        ease: "easeOut",
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Smooth scroll-linked vertical parallax float for feature showcase panels
 */
export function ParallaxShowcase({
  children,
  className,
  offset = 22,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rawY = useTransform(scrollYProgress, [0, 0.5, 1], [offset, 0, -offset]);
  const y = useSpring(rawY, { stiffness: 180, damping: 28 });

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

export function SpotlightSurface({
  children,
  className,
  hoverLift = false,
}: {
  children: ReactNode;
  className?: string;
  hoverLift?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // The spotlight glow follows the cursor via CSS variables only (no React state,
  // no re-render). The old 3D mouse-tilt was removed on purpose: it kept moving the
  // card underneath the pointer, so the button inside could shift between
  // mousedown and mouseup and the click was lost.
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "nova-spotlight rounded-xl border border-zinc-200/90 bg-white transition-[border-color,box-shadow,transform] duration-200 hover:border-emerald-600/35 dark:border-zinc-800/90 dark:bg-[#111113] dark:hover:border-emerald-500/35",
        hoverLift && "hover:shadow-lg hover:shadow-emerald-950/6 dark:hover:shadow-black/40",
        className
      )}
    >
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const prevValRef = useRef(value);

  const format = (v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`;

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const start = prevValRef.current;
    const end = value;
    prevValRef.current = value;
    if (start === end) {
      el.textContent = format(end);
      return;
    }
    const startTime = performance.now();
    const duration = 300;
    let rafId: number;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;
      if (el) el.textContent = format(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else if (el) {
        el.textContent = format(end);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value, decimals, prefix, suffix]);

  return (
    <span ref={spanRef} className={className}>
      {format(value)}
    </span>
  );
}

export function PortalTransitionOverlay({
  open,
  userName,
  userEmail,
  userPicture,
  verifiedLabel,
  launchingLabel,
}: {
  open: boolean;
  userName?: string;
  userEmail?: string;
  userPicture?: string;
  verifiedLabel: string;
  launchingLabel: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="nova-portal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#FAFAFA]/96 px-6 backdrop-blur-xl dark:bg-[#09090B]/96"
        >
          <div className="bg-hero-grid pointer-events-none absolute inset-0" />

          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={SPRING_SNAPPY}
            className="relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-emerald-600/20 bg-white p-8 text-center shadow-2xl shadow-emerald-950/10 dark:border-zinc-800 dark:bg-[#111113]"
          >
            {/* Rotating precision ring + Star-N emblem */}
            <div className="relative flex h-20 w-20 items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2.8,
                  ease: "linear",
                }}
                className="absolute inset-0 rounded-2xl border-2 border-dashed border-emerald-500/45"
              />
              <motion.div
                initial={{ scale: 0.72 }}
                animate={{ scale: [0.95, 1.05, 1] }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-emerald-500/30 bg-[#020503] p-1.5 shadow-md"
              >
                <Image
                  src="/logo-mark.png"
                  alt="IELTS Nova"
                  width={56}
                  height={56}
                  priority
                  className="h-full w-full object-contain"
                />
              </motion.div>
            </div>

            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {verifiedLabel}
            </div>

            {userName && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-200/90 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                {userPicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userPicture}
                    alt={userName}
                    referrerPolicy="no-referrer"
                    className="h-9 w-9 rounded-full border border-emerald-500/40 object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-mono text-xs font-bold text-white shadow-xs shadow-emerald-600/25">
                    {userName[0]?.toUpperCase() ?? "G"}
                  </span>
                )}
                <div className="text-left">
                  <div className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                    {userName}
                  </div>
                  {userEmail && (
                    <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {userEmail}
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {launchingLabel}
            </p>

            {/* Sweeping Emerald Progress Bar */}
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-zinc-800">
              <motion.div
                initial={{ width: "8%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
