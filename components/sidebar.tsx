"use client";

import {
  BarChart3,
  BookOpen,
  FileText,
  Flame,
  Headphones,
  LayoutDashboard,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  PenTool,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand";
import { AnimatedNumber } from "@/components/motion";
import { ProgressBar } from "@/components/ui";
import { DICT, type Lang } from "@/lib/i18n";
import { computeStreak, useAppState } from "@/lib/store";
import { OFFICIAL_TESTS } from "@/lib/tests-registry";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const state = useAppState();
  const lang: Lang = state.lang;
  const t = DICT[lang].nav;
  const streak = computeStreak(state.activity);

  const compact = !isMobile && collapsed;
  const listeningCount = OFFICIAL_TESTS.filter(
    (test) => test.skill === "listening"
  ).length;
  const readingCount = OFFICIAL_TESTS.filter(
    (test) => test.skill === "reading"
  ).length;
  const practiceCount = listeningCount + readingCount;

  const primaryNav = [
    {
      href: "/dashboard",
      label: t.home,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/dashboard/full-mock",
      label: t.fullMock || "To'liq Full Mock",
      icon: Sparkles,
      badge: "80Q",
    },
    {
      href: "/dashboard/practice",
      label: t.practice,
      icon: FileText,
      badge: String(practiceCount),
    },
    {
      href: "/dashboard/results",
      label: t.results,
      icon: BarChart3,
      badge: state.attempts.length > 0 ? String(state.attempts.length) : undefined,
    },
    {
      href: "/dashboard/streak",
      label: t.streak,
      icon: Flame,
    },
  ];

  const moduleNav = [
    {
      href: "/dashboard/listening",
      label: t.listening,
      icon: Headphones,
      meta: `${listeningCount} Tests`,
      enabled: true,
    },
    {
      href: "/dashboard/reading",
      label: t.reading,
      icon: BookOpen,
      meta: `${readingCount} Tests`,
      enabled: true,
    },
    {
      href: "/writing",
      label: t.writing,
      icon: PenTool,
      meta: "CDI + AI",
      enabled: true,
    },
    {
      href: "#speaking-soon",
      label: t.speaking,
      icon: Mic,
      meta: t.soon,
      enabled: false,
    },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111113]">
      {/* Top Brand Header */}
      <div
        className={cn(
          "shrink-0 flex h-[68px] items-center border-b border-zinc-200/80 px-4 dark:border-zinc-800/80",
          compact ? "justify-center px-2" : "justify-between"
        )}
      >
        <BrandLogo compact={compact} href="/dashboard" subtitle="CDI SUITE" />
        {!isMobile && !compact && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={t.collapse}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
        {isMobile && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {compact && !isMobile && onToggleCollapse && (
        <div className="flex justify-center pt-3 shrink-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={t.expand}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-600/40 hover:text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Scrollable Navigation Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain select-none scrollbar-thin px-3 py-4 space-y-6">
        {/* Primary Menu */}
        <div>
          {!compact && (
            <div className="mb-2 px-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {t.menu}
            </div>
          )}
          <nav className="space-y-1">
            {primaryNav.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  title={compact ? item.label : undefined}
                  className={cn(
                    "group relative z-20 cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                    compact && "justify-center px-2",
                    active
                      ? "bg-emerald-100 text-emerald-800 font-semibold border-l-4 border-emerald-500 rounded-l-none dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500"
                      : "text-zinc-600 hover:bg-emerald-500/8 hover:text-emerald-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "pointer-events-none relative z-10 h-4 w-4 shrink-0 transition-colors duration-150",
                      active
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-zinc-500 group-hover:text-emerald-600 dark:text-zinc-400 dark:group-hover:text-emerald-400"
                    )}
                  />
                  {!compact && (
                    <>
                      <span className="pointer-events-none relative z-10 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={cn(
                            "pointer-events-none relative z-10 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold border",
                            item.badge === "80Q"
                              ? active
                                ? "border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-800/80 dark:bg-sky-950/80 dark:text-sky-300"
                                : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300"
                              : item.badge === "20"
                                ? "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                : active
                                  ? "border-emerald-300 bg-emerald-200/70 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* IELTS Modules */}
        <div className="pt-2">
          {!compact && (
            <div className="mb-2 px-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {t.modules}
            </div>
          )}
          <nav className="space-y-1">
            {moduleNav.map((item) => {
              const Icon = item.icon;
              if (!item.enabled) {
                return (
                  <div
                    key={item.label}
                    title={compact ? `${item.label} (${item.meta})` : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-400 select-none dark:text-zinc-600",
                      compact && "justify-center px-2"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-60" />
                    {!compact && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <span className="rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                          {item.meta}
                        </span>
                      </>
                    )}
                  </div>
                );
              }

              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  title={compact ? item.label : undefined}
                  className={cn(
                    "group relative z-20 cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150",
                    compact && "justify-center px-2",
                    active
                      ? "bg-emerald-100 text-emerald-800 font-semibold border-l-4 border-emerald-500 rounded-l-none dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500"
                      : "text-zinc-600 hover:bg-emerald-500/8 hover:text-emerald-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "pointer-events-none relative z-10 h-4 w-4 shrink-0 transition-colors duration-150",
                      active
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-zinc-500 group-hover:text-emerald-600 dark:text-zinc-400 dark:group-hover:text-emerald-400"
                    )}
                  />
                  {!compact && (
                    <>
                      <span className="pointer-events-none relative z-10 flex-1 truncate">
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "pointer-events-none relative z-10 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold border",
                          item.meta === "CDI + AI"
                            ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300"
                            : "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                        )}
                      >
                        {item.meta}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Streak Widget + Settings */}
        <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2.5 pb-10">
          {!compact ? (
            <Link
              href="/dashboard/streak"
              prefetch={true}
              className="relative z-20 block rounded-xl border border-emerald-600/20 bg-emerald-50/50 p-3.5 transition-colors hover:border-emerald-600/45 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-emerald-500/45 cursor-pointer"
            >
              <div className="pointer-events-none flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  <Flame
                    className={cn(
                      "h-3.5 w-3.5",
                      streak.activeToday
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-emerald-600/60 dark:text-zinc-400"
                    )}
                  />
                  {t.dailyStreak}
                </span>
                <span
                  className={cn(
                    "font-mono text-[10px] font-bold uppercase tracking-wider",
                    streak.activeToday
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  )}
                >
                  {streak.activeToday ? t.active : "—"}
                </span>
              </div>

              <div className="pointer-events-none mt-2 flex items-baseline justify-between">
                <span className="font-mono text-base font-bold text-zinc-950 dark:text-zinc-50">
                  <AnimatedNumber value={streak.current} />{" "}
                  <span className="font-sans text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {t.days}
                  </span>
                </span>
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {streak.todayCount}/{state.profile.dailyGoal} {t.todayGoal}
                </span>
              </div>

              <div className="pointer-events-none">
                <ProgressBar
                  value={streak.todayCount}
                  max={state.profile.dailyGoal}
                  className="mt-2 h-1.5"
                />
              </div>
            </Link>
          ) : (
            <Link
              href="/dashboard/streak"
              prefetch={true}
              title={`${t.dailyStreak}: ${streak.current} ${t.days}`}
              className="relative z-20 flex h-10 w-full items-center justify-center rounded-lg border border-emerald-600/20 bg-emerald-50/60 text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400 cursor-pointer"
            >
              <Flame className="pointer-events-none h-4 w-4" />
            </Link>
          )}

          <Link
            href="/dashboard/settings"
            prefetch={true}
            title={compact ? t.settings : undefined}
            className={cn(
              "relative z-20 cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              compact && "justify-center px-2",
              isActive("/dashboard/settings")
                ? "bg-emerald-100 text-emerald-800 font-semibold border-l-4 border-emerald-500 rounded-l-none dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500"
                : "text-zinc-600 hover:bg-emerald-500/8 hover:text-emerald-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <Settings
              className={cn(
                "pointer-events-none relative z-10 h-4 w-4 shrink-0 transition-colors duration-150",
                isActive("/dashboard/settings")
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-zinc-500 dark:text-zinc-400"
              )}
            />
            {!compact && <span className="pointer-events-none relative z-10">{t.settings}</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}
