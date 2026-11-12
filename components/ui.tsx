"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import {
  AnimatedNumber,
  SPRING_SNAPPY,
  SPRING_TACTILE,
  SpotlightSurface,
} from "./motion";

export const btnPrimary =
  "btn-sheen relative z-20 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-colors duration-150 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/25 disabled:pointer-events-none disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer select-none";

export const btnContrast =
  "btn-sheen relative z-20 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-colors duration-150 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/25 dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer select-none";

export const btnOutline =
  "relative z-20 inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors duration-150 hover:border-emerald-600/50 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-[#111113] dark:text-zinc-100 dark:hover:border-emerald-500/50 dark:hover:bg-zinc-900 cursor-pointer select-none";

export const btnGhost =
  "relative z-20 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors duration-150 hover:bg-emerald-500/8 hover:text-emerald-700 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100 cursor-pointer select-none";

export function Card({
  children,
  className,
  hoverLift = false,
}: {
  children: ReactNode;
  className?: string;
  hoverLift?: boolean;
}) {
  return (
    <SpotlightSurface hoverLift={hoverLift} className={className}>
      {children}
    </SpotlightSurface>
  );
}

export function Badge({
  children,
  tone = "neutral",
  mono = false,
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "emerald" | "dark" | "danger" | "sky";
  mono?: boolean;
  className?: string;
}) {
  const tones = {
    neutral:
      "border-zinc-200 bg-zinc-100/85 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
    emerald:
      "border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400",
    dark:
      "border-emerald-600/20 bg-emerald-50/90 text-emerald-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    danger:
      "border-red-500/25 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400",
    sky:
      "border-sky-200 bg-sky-50 text-sky-700 shadow-xs dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-tight",
        mono && "font-mono uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SNAPPY}
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="space-y-1.5">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-[26px] dark:text-zinc-50">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </motion.div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-emerald-100/70 dark:bg-zinc-800/90",
        className
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 110, damping: 21 }}
        className="relative h-full overflow-hidden rounded-full bg-emerald-600 dark:bg-emerald-500"
      >
        {pct > 0 && (
          <span className="animate-progress-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        )}
      </motion.div>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <Card hoverLift className="group p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200",
            accent
              ? "border-emerald-600/25 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "border-emerald-600/15 bg-emerald-50/60 text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 font-mono text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </div>
      {hint && (
        <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>
      )}
    </Card>
  );
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  const uid = useId();
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100/85 p-1 dark:border-zinc-800 dark:bg-zinc-900/85">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer",
              isActive
                ? "text-white"
                : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`tab-pill-${uid}`}
                transition={SPRING_SNAPPY}
                className="pointer-events-none absolute inset-0 rounded-lg bg-emerald-600 shadow-xs shadow-emerald-600/25"
              />
            )}
            <span className="relative z-10">{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "relative z-10 rounded-md px-1.5 py-0.5 font-mono text-[10px]",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={SPRING_SNAPPY}
    >
      <Card className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-600/20 bg-emerald-50/70 text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-950 dark:text-zinc-100">
          {title}
        </h3>
        <p className="mt-1.5 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </Card>
    </motion.div>
  );
}
