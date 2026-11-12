"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Headphones,
  Lock,
  PenTool,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { computeStreak, useAppState } from "@/lib/store";
import StreakLoading from "./loading";
import {
  addDays,
  cn,
  dateKey,
  formatClock,
  secondsUntilMidnight,
  startOfDay,
} from "@/lib/utils";

export interface DailyTaskReport {
  dayNumber: number;
  dateKey: string;
  formattedDate: string;
  dayOfMonth: number;
  monthName: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  readingDone: boolean;
  listeningDone: boolean;
  writingDone: boolean;
  questionsCount: number;
  totalQuestions: number;
  timeSpentMinutes: number;
  readingBand?: number;
  listeningBand?: number;
  writingBand?: number;
  status: "completed" | "in_progress" | "missed" | "upcoming";
}

export default function DailyStreakPage() {
  return (
    <Suspense fallback={<StreakLoading />}>
      <motion.div
        initial={{ opacity: 0, filter: "blur(5px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <DailyStreakContent />
      </motion.div>
    </Suspense>
  );
}

function DailyStreakContent() {
  const state = useAppState();
  const [secsLeft, setSecsLeft] = useState<number>(28800);
  const [selectedDay, setSelectedDay] = useState<DailyTaskReport | null>(null);

  useEffect(() => {
    setSecsLeft(secondsUntilMidnight());
    const id = setInterval(() => setSecsLeft(secondsUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  // Listen for Escape key to dismiss day modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDay(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const streak = computeStreak(state.activity);

  // Executive greeting with exact user full name
  const candidateName =
    state.profile.name?.trim() ||
    state.authUser?.name?.trim() ||
    (state.authUser?.email ? state.authUser.email.split("@")[0] : "") ||
    "Candidate";

  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => dateKey(now), [now]);
  const year = now.getFullYear();
  const month = now.getMonth();

  // 30-Day Preparation Roadmap calculation
  const roadmapDays: DailyTaskReport[] = useMemo(() => {
    const list: DailyTaskReport[] = [];
    const locale =
      state.lang === "ru" ? "ru-RU" : state.lang === "uz" ? "uz-UZ" : "en-GB";

    for (let dayNum = 1; dayNum <= 30; dayNum++) {
      const d = new Date(year, month, dayNum);
      const k = dateKey(d);
      const isToday = k === todayKey;
      const isPast = d < startOfDay(now);
      const isFuture = d > startOfDay(now);

      const monthName = d.toLocaleDateString(locale, { month: "short" });
      const formattedDate = d.toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Query real attempts recorded for this exact day
      const dayAttempts = state.attempts.filter(
        (a) => dateKey(new Date(a.submittedAt)) === k
      );
      const readingAttempts = dayAttempts.filter((a) => a.skill === "reading");
      const listeningAttempts = dayAttempts.filter(
        (a) => a.skill === "listening"
      );
      const writingAttempts = dayAttempts.filter(
        (a) => (a.skill as string) === "writing"
      );

      const activityCount = state.activity[k] ?? 0;

      // Module status check
      const readingDone =
        readingAttempts.length > 0 || (isPast && activityCount >= 30);
      const listeningDone =
        listeningAttempts.length > 0 || (isPast && activityCount >= 30);
      const writingDone =
        writingAttempts.length > 0 || (isPast && activityCount >= 60);

      const totalQuestionsForDay = Math.max(
        activityCount,
        dayAttempts.reduce((acc, a) => acc + (a.total || 40), 0)
      );

      const timeSpentMinutes =
        Math.round(
          dayAttempts.reduce((acc, a) => acc + (a.timeSpentSec || 0), 0) / 60
        ) || (activityCount > 0 ? Math.min(65, activityCount * 2) : 0);

      const bestReadingBand =
        readingAttempts.length > 0
          ? Math.max(...readingAttempts.map((a) => a.band))
          : undefined;
      const bestListeningBand =
        listeningAttempts.length > 0
          ? Math.max(...listeningAttempts.map((a) => a.band))
          : undefined;
      const bestWritingBand =
        writingAttempts.length > 0
          ? Math.max(...writingAttempts.map((a) => a.band))
          : undefined;

      let status: "completed" | "in_progress" | "missed" | "upcoming";
      if (isToday) {
        status =
          readingDone && listeningDone
            ? "completed"
            : activityCount > 0
              ? "in_progress"
              : "in_progress";
      } else if (isPast) {
        status =
          readingDone || listeningDone || writingDone || activityCount > 0
            ? "completed"
            : "missed";
      } else {
        status = "upcoming";
      }

      list.push({
        dayNumber: dayNum,
        dateKey: k,
        formattedDate,
        dayOfMonth: dayNum,
        monthName,
        isToday,
        isPast,
        isFuture,
        readingDone,
        listeningDone,
        writingDone,
        questionsCount: totalQuestionsForDay,
        totalQuestions: 80,
        timeSpentMinutes,
        readingBand: bestReadingBand,
        listeningBand: bestListeningBand,
        writingBand: bestWritingBand,
        status,
      });
    }

    return list;
  }, [now, todayKey, year, month, state.lang, state.attempts, state.activity]);

  // Aggregate stats
  const completedDaysCount = roadmapDays.filter(
    (d) => d.status === "completed"
  ).length;
  const roadmapCompletionPct = Math.min(
    100,
    Math.round((completedDaysCount / 30) * 100)
  );

  return (
    <div className="relative z-10 space-y-8 pb-16">
      {/* 1. Executive Header & Greeting */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/80 to-emerald-50/30 p-6 shadow-sm dark:border-slate-800/80 dark:bg-gradient-to-br dark:from-[#0B1519] dark:via-[#0F1E24] dark:to-[#071317] dark:shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>30-KUNLIK INTENSIV PROTOKOL</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
              Welcome, {candidateName}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              CDI imtihoniga to&apos;liq tayyorgarlik grafigi. Har bir kunlik
              rejim Listening, Reading va Writing modullari bo&apos;yicha
              bosqichma-bosqich tahlil qilinadi.
            </p>
          </div>

          {/* Quick countdown clock */}
          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80">
            <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                KUNLIK RESETGACHA
              </div>
              <div className="font-mono text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {formatClock(secsLeft)}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Executive 4-KPI Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4 transition-all hover:border-emerald-500/40 dark:border-slate-800/80 dark:bg-[#0E1A22]">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Faol Uzluksizlik</span>
              <Flame
                className={cn(
                  "h-4 w-4",
                  streak.activeToday
                    ? "text-emerald-500"
                    : "text-slate-400 dark:text-slate-600"
                )}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                {streak.current}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                kun ketma-ket
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>
                {streak.activeToday
                  ? "Bugungi norma bajarildi"
                  : "Bugungi rejim kutilmoqda"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4 transition-all hover:border-emerald-500/40 dark:border-slate-800/80 dark:bg-[#0E1A22]">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Shaxsiy Rekord</span>
              <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                {streak.best}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                kun eng yuqori
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Uzluksiz intizom ko&apos;rsatkichi
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4 transition-all hover:border-emerald-500/40 dark:border-slate-800/80 dark:bg-[#0E1A22]">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Roadmap Grafigi</span>
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                {completedDaysCount}{" "}
                <span className="text-base font-normal text-slate-400">
                  / 30
                </span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                kun
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${roadmapCompletionPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4 transition-all hover:border-emerald-500/40 dark:border-slate-800/80 dark:bg-[#0E1A22]">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Bugungi Savollar</span>
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                {streak.todayCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                / {state.profile.dailyGoal} ta maqsad
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {streak.todayCount >= state.profile.dailyGoal
                ? "Kunlik kvota 100% bajarildi"
                : `${Math.max(0, state.profile.dailyGoal - streak.todayCount)} ta savol qoldi`}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 30-Day Interactive Habit Roadmap Grid */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              30-Kunlik O&apos;quv Tarmog&apos;i (Roadmap Matrix)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Istalgan kun kartochkasini bosib, o&apos;sha kundagi Reading,
              Listening va Writing bo&apos;yicha batafsil hisobotni ko&apos;ring.
            </p>
          </div>

          {/* Legend indicators */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span>Yakunlangan</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-emerald-400 bg-emerald-500/20" />
              <span>Bugun faol</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-slate-700 bg-slate-800" />
              <span>Kutilmoqda / Bo&apos;sh</span>
            </span>
          </div>
        </div>

        {/* 30 Interactive Cards Grid: 6 cols on desktop, 3 cols on tablet, 2 cols on mobile */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 sm:gap-3.5">
          {roadmapDays.map((item) => {
            const isCompleted = item.status === "completed";
            const isToday = item.isToday;

            return (
              <button
                key={item.dayNumber}
                type="button"
                onClick={() => setSelectedDay(item)}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl p-3.5 text-left transition-all duration-200 cursor-pointer select-none",
                  "hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                  // Card status surfaces
                  isToday
                    ? "border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white text-slate-900 shadow-md shadow-emerald-500/20 dark:border-emerald-400 dark:bg-gradient-to-br dark:from-[#0E2824] dark:to-[#0B171D] dark:text-white"
                    : isCompleted
                      ? "border border-emerald-500/40 bg-emerald-50/50 text-slate-900 dark:border-emerald-500/30 dark:bg-[#0C1D1F] dark:text-slate-100"
                      : "border border-slate-200/90 bg-white text-slate-800 dark:border-slate-800/90 dark:bg-[#0B131E] dark:text-slate-300"
                )}
              >
                {/* Top: Day Number + Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tracking-wider text-slate-900 dark:text-white">
                    DAY {item.dayNumber.toString().padStart(2, "0")}
                  </span>
                  {isCompleted ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  ) : isToday ? (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                  ) : (
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-600">
                      —
                    </span>
                  )}
                </div>

                {/* Middle: Date */}
                <div className="my-2.5">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {item.dayOfMonth}-{item.monthName}
                  </div>
                  {item.questionsCount > 0 ? (
                    <div className="mt-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {item.questionsCount} ta savol
                    </div>
                  ) : (
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400 dark:text-slate-600">
                      0 topshiriq
                    </div>
                  )}
                </div>

                {/* Bottom: 3-Module Check Indicators (Reading, Listening, Writing) */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
                  <span
                    title={
                      item.readingDone
                        ? "Reading: Bajarildi"
                        : "Reading: Bajarilmagan"
                    }
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-bold transition-colors",
                      item.readingDone
                        ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800/70 dark:text-slate-600"
                    )}
                  >
                    R
                  </span>
                  <span
                    title={
                      item.listeningDone
                        ? "Listening: Bajarildi"
                        : "Listening: Bajarilmagan"
                    }
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-bold transition-colors",
                      item.listeningDone
                        ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800/70 dark:text-slate-600"
                    )}
                  >
                    L
                  </span>
                  <span
                    title={
                      item.writingDone
                        ? "Writing: Bajarildi"
                        : "Writing: Bajarilmagan"
                    }
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-bold transition-colors",
                      item.writingDone
                        ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800/70 dark:text-slate-600"
                    )}
                  >
                    W
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Day Breakdown Modal with Backdrop Blur */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedDay(null)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Dialog Content */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="day-modal-title"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B131E] dark:text-slate-100 sm:p-7"
            >
              {/* Header: Title + Close Button */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800/90">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>
                      KUNLIK PROTOKOL #
                      {selectedDay.dayNumber.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <h3
                    id="day-modal-title"
                    className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
                  >
                    Day {selectedDay.dayNumber.toString().padStart(2, "0")} —{" "}
                    {selectedDay.formattedDate}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Yopish"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status Overview Banner */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-[#0E1A22]">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Umumiy holat
                  </span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {selectedDay.status === "completed"
                      ? "To'liq yakunlangan"
                      : selectedDay.isToday
                        ? "Bugungi faol rejim"
                        : selectedDay.isPast
                          ? "Qisman / O'tkazilgan"
                          : "Rejadagi kun"}
                  </div>
                </div>

                <span
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-xs font-semibold border",
                    selectedDay.status === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : selectedDay.isToday
                        ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                        : "border-slate-300 bg-slate-200/60 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {selectedDay.status === "completed"
                    ? "✓ COMPLETED"
                    : selectedDay.isToday
                      ? "● IN PROGRESS"
                      : selectedDay.isPast
                        ? "○ MISSED"
                        : "🔒 UPCOMING"}
                </span>
              </div>

              {/* 3 Modular Tasks Checklist (Reading, Listening, Writing) */}
              <div className="mt-5 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Modullar kesimida tahlil
                </h4>

                {/* 1. Reading Task */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3.5 transition-all",
                    selectedDay.readingDone
                      ? "border-emerald-500/30 bg-emerald-50/50 dark:border-emerald-500/25 dark:bg-[#0C1D1F]"
                      : "border-slate-200 bg-slate-50/60 dark:border-slate-800/80 dark:bg-[#0B131E]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border",
                        selectedDay.readingDone
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-300 bg-slate-200/50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                      )}
                    >
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Academic Reading
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedDay.readingDone
                          ? `40 ta savol tahlil qilindi ${selectedDay.readingBand ? `• Band ${selectedDay.readingBand.toFixed(1)}` : ""}`
                          : "Topshiriq hali topshirilmagan"}
                      </div>
                    </div>
                  </div>

                  {selectedDay.readingDone ? (
                    <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Bajarildi</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-mono text-xs text-slate-400 dark:text-slate-500">
                      <Circle className="h-3.5 w-3.5" />
                      <span>Bajarilmadi</span>
                    </span>
                  )}
                </div>

                {/* 2. Listening Task */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3.5 transition-all",
                    selectedDay.listeningDone
                      ? "border-emerald-500/30 bg-emerald-50/50 dark:border-emerald-500/25 dark:bg-[#0C1D1F]"
                      : "border-slate-200 bg-slate-50/60 dark:border-slate-800/80 dark:bg-[#0B131E]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border",
                        selectedDay.listeningDone
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-300 bg-slate-200/50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                      )}
                    >
                      <Headphones className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Listening Simulation
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedDay.listeningDone
                          ? `40 ta savol tahlil qilindi ${selectedDay.listeningBand ? `• Band ${selectedDay.listeningBand.toFixed(1)}` : ""}`
                          : "Topshiriq hali topshirilmagan"}
                      </div>
                    </div>
                  </div>

                  {selectedDay.listeningDone ? (
                    <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Bajarildi</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-mono text-xs text-slate-400 dark:text-slate-500">
                      <Circle className="h-3.5 w-3.5" />
                      <span>Bajarilmadi</span>
                    </span>
                  )}
                </div>

                {/* 3. Writing Task */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3.5 transition-all",
                    selectedDay.writingDone
                      ? "border-emerald-500/30 bg-emerald-50/50 dark:border-emerald-500/25 dark:bg-[#0C1D1F]"
                      : "border-slate-200 bg-slate-50/60 dark:border-slate-800/80 dark:bg-[#0B131E]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border",
                        selectedDay.writingDone
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-300 bg-slate-200/50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                      )}
                    >
                      <PenTool className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Writing (Task 1 & 2)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedDay.writingDone
                          ? `Hisobot va Esse tahlil qilindi ${selectedDay.writingBand ? `• Band ${selectedDay.writingBand.toFixed(1)}` : ""}`
                          : "Topshiriq hali topshirilmagan"}
                      </div>
                    </div>
                  </div>

                  {selectedDay.writingDone ? (
                    <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Bajarildi</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-mono text-xs text-slate-400 dark:text-slate-500">
                      <Circle className="h-3.5 w-3.5" />
                      <span>Bajarilmadi</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Day Metrics Quick Bar */}
              <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-[#0E1A22]/50 text-center">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Savollar hajmi
                  </div>
                  <div className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white">
                    {selectedDay.questionsCount} ta
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sarflangan vaqt
                  </div>
                  <div className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white">
                    {selectedDay.timeSpentMinutes > 0
                      ? `${selectedDay.timeSpentMinutes} daq`
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/90">
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 cursor-pointer"
                >
                  Yopish
                </button>

                {selectedDay.isToday || !selectedDay.isPast ? (
                  <Link
                    href="/dashboard/listening"
                    prefetch={true}
                    onClick={() => setSelectedDay(null)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors cursor-pointer"
                  >
                    <span>Topshiriqni boshlash</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
