"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Headphones,
  Mic,
  PenTool,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  AnimatedNumber,
  SPRING_SNAPPY,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";
import {
  Badge,
  btnOutline,
  Card,
  ProgressBar,
} from "@/components/ui";
import { DICT, translateGoal } from "@/lib/i18n";
import {
  actions,
  overallEstimatedBand,
  useAppState,
} from "@/lib/store";
import { OFFICIAL_TESTS, TEST_BY_ID } from "@/lib/tests-registry";
import { cn, daysUntil, formatDuration } from "@/lib/utils";
import { WRITING_TESTS } from "@/lib/writing-tests";

const TARGET_BANDS = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

export default function DashboardHomePage() {
  const state = useAppState();
  const t = DICT[state.lang].home;
  const navT = DICT[state.lang].nav;
  const authT = DICT[state.lang].auth;
  const [editingDate, setEditingDate] = useState(false);

  const estBand = overallEstimatedBand(state);
  const daysRemaining = daysUntil(state.profile.examDate);

  const candidateDisplayName =
    state.profile.name && state.profile.name !== "Candidate"
      ? state.profile.name
      : state.authUser?.name || state.profile.name;

  const candidateAge =
    state.profile.age ||
    (state.profile.birthYear
      ? new Date().getFullYear() - state.profile.birthYear
      : null);

  const localizedGoal = state.profile.goal
    ? translateGoal(state.profile.goal, state.lang)
    : null;

  return (
    <StaggerContainer className="space-y-7">
      {/* =====================================================================
          EXECUTIVE BRAND HERO: IELTS NOVA · CDI SUITE
          ===================================================================== */}
      <StaggerItem>
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/30 p-6 text-slate-900 shadow-sm sm:p-8 dark:border-emerald-500/20 dark:bg-gradient-to-br dark:from-[#0B1519] dark:via-[#0F1E24] dark:to-[#071317] dark:text-white dark:shadow-xl">
          <div className="relative z-10">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-100/70 px-3 py-1 font-mono text-xs font-bold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                RASMIY CAMBRIDGE CDI IMTIHON SIMULYATORI
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                Listening · Reading · 80 Savol
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
              IELTS Nova <span className="text-emerald-600 dark:text-emerald-400">· CDI Suite</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-zinc-300">
              Haqiqiy Computer-Delivered IELTS (CDI) imtihon standarti: split-screen
              o&apos;qish muhiti, audio sinxronizatsiya, matn ajratgich (highlighter),
              avtomatik rasmiy Band hisoblash va sun&apos;iy intellekt orqali xatolarni
              chuqur tushuntirish platformasi.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/full-mock"
                prefetch={true}
                className="relative z-20 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer transition-colors"
              >
                <Sparkles className="w-5 h-5 pointer-events-none" />
                <span className="pointer-events-none">To&apos;liq Full Mock (80 Savol)</span>
              </Link>
              <Link
                href="/dashboard/practice"
                prefetch={true}
                className="relative z-20 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300/80 bg-white/80 text-slate-800 font-medium cursor-pointer transition-colors hover:border-emerald-500/60 hover:bg-white hover:text-emerald-700 dark:border-zinc-700 dark:bg-white/10 dark:text-white dark:hover:border-zinc-500 dark:hover:bg-white/20"
              >
                <BookOpen className="w-5 h-5 pointer-events-none" />
                <span className="pointer-events-none">
                  Mock Testlar Markazi ({OFFICIAL_TESTS.filter((x) => x.skill !== "full").length} Test)
                </span>
              </Link>
            </div>
          </div>

          {/* Background Decorative Emerald Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/10" />
        </div>
      </StaggerItem>

      {/* Candidate Profile Details Pill Strip */}
      {(candidateAge || localizedGoal) && (
        <StaggerItem>
          <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-emerald-600/20 bg-emerald-50/50 p-3 text-xs sm:px-4 dark:border-zinc-800/80 dark:bg-zinc-900/60">
            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {candidateDisplayName}
            </span>
            {candidateAge && (
              <span className="font-mono text-zinc-600 dark:text-zinc-400">
                · {candidateAge} {authT.yearsOld}
              </span>
            )}
            {localizedGoal && (
              <span className="rounded-md border border-emerald-600/20 bg-white/90 px-2.5 py-0.5 font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                {localizedGoal}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-0.5 font-mono font-semibold text-sky-700 shadow-xs dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              {t.targetBand}: {state.profile.targetBand.toFixed(1)}
            </span>
            {state.authUser?.email && (
              <span className="ml-auto font-mono text-[11px] text-zinc-500 dark:text-zinc-500">
                {state.authUser.email}
              </span>
            )}
          </div>
        </StaggerItem>
      )}

      {/* 2-Column Row: Exam Countdown + Target Band Score */}
      <StaggerItem className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Exam Countdown */}
        <Card hoverLift className="flex h-full flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-600/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Calendar className="h-5 w-5" />
                </span>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                  {t.countdownTitle}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setEditingDate((v) => !v)}
                className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer"
              >
                {state.profile.examDate ? t.changeDate : t.setDate}
              </button>
            </div>

            <AnimatePresence>
              {editingDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                    <input
                      type="date"
                      value={state.profile.examDate ?? ""}
                      onChange={(e) => {
                        actions.setProfile({ examDate: e.target.value || null });
                        setEditingDate(false);
                      }}
                      className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-900 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-5">
              {daysRemaining === null ? (
                <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {t.countdownUnset}
                </p>
              ) : daysRemaining > 0 ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                      <AnimatedNumber value={daysRemaining} />
                    </span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {daysRemaining === 1 ? t.dayLeft : t.daysLeft}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {t.countdownDatePrefix} {state.profile.examDate}
                  </p>
                </div>
              ) : daysRemaining === 0 ? (
                <div className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {t.examToday}
                </div>
              ) : (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t.examPassed} ({state.profile.examDate})
                </div>
              )}
            </div>
          </div>

          {!state.profile.examDate && !editingDate && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setEditingDate(true)}
                className={cn(btnOutline, "w-full justify-center py-2 text-xs")}
              >
                <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.setDate}</span>
              </button>
            </div>
          )}
        </Card>

        {/* Target Band Score */}
        <Card hoverLift className="flex h-full flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-600/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Target className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                    {t.targetTitle}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t.targetSubtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.currentEst}
                </div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-zinc-950 dark:text-zinc-50">
                  {estBand !== null ? (
                    <AnimatedNumber value={estBand} decimals={1} />
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-600/25 bg-emerald-500/8 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/12">
                <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  {t.targetBand}
                </div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  <AnimatedNumber value={state.profile.targetBand} decimals={1} />
                </div>
              </div>
            </div>

            {estBand !== null ? (
              <div className="mt-4">
                <ProgressBar value={estBand} max={state.profile.targetBand} />
              </div>
            ) : (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {t.noBandYet}
              </p>
            )}
          </div>

          {/* Quick Target Band Selector with Gliding Pill */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-2">
            {TARGET_BANDS.map((b) => {
              const active = state.profile.targetBand === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => actions.setProfile({ targetBand: b })}
                  className={cn(
                    "relative rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-colors duration-150 cursor-pointer",
                    active
                      ? "text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-600/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="home-target-band-pill"
                      transition={SPRING_SNAPPY}
                      className="pointer-events-none absolute inset-0 rounded-md bg-emerald-600 shadow-2xs shadow-emerald-600/25"
                    />
                  )}
                  <span className="relative z-10">{b.toFixed(1)}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </StaggerItem>

      {/* =====================================================================
          EXECUTIVE 2-PORTAL HUBS: FULL MOCK (80Q) & PRACTICE (20 TESTS)
          ===================================================================== */}
      <StaggerItem className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Hub 1: Full Mock */}
        <Card hoverLift className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
                <Sparkles className="h-6 w-6" />
              </div>
              <Badge tone="emerald" mono>
                80 SAVOL · 100 DAQ
              </Badge>
            </div>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              To&apos;liq Full Mock Imtihoni
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Listening (40 savol, 4 qism) va Reading (40 savol, 3 matn) ketma-ket
              rasmiy Cambridge CDI tartibida o&apos;tkaziladi. Matn belgilash,
              taymer va avtomatik umumiy Band hisoblanadi.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-200/70 dark:border-zinc-800/70">
            <Link
              href="/dashboard/full-mock"
              prefetch={true}
              className="relative z-20 cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              <span className="pointer-events-none">Full Mock Sahifasiga o&apos;tish</span>
              <ArrowRight className="pointer-events-none h-4 w-4" />
            </Link>
          </div>
        </Card>

        {/* Hub 2: Practice 20 Tests */}
        <Card hoverLift className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-600/20 bg-emerald-50 text-emerald-700 shadow-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <Badge tone="dark" mono>
                {OFFICIAL_TESTS.filter((x) => x.skill !== "full").length} TA RASMIY MOCK
              </Badge>
            </div>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Mock Testlar Katalogi
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {OFFICIAL_TESTS.filter((x) => x.skill === "listening").length} ta to&apos;liq Listening va{" "}
              {OFFICIAL_TESTS.filter((x) => x.skill === "reading").length} ta to&apos;liq
              Academic Reading alohida mashg&apos;ulot rejimi.
              Xohlagan testingizdan boshlang.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-200/70 dark:border-zinc-800/70">
            <Link
              href="/dashboard/practice"
              prefetch={true}
              className="relative z-20 cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-xs font-bold text-zinc-900 shadow-2xs hover:border-emerald-600/40 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700 transition-colors"
            >
              <span className="pointer-events-none">
                Barcha {OFFICIAL_TESTS.filter((x) => x.skill !== "full").length} ta Mock Testni ko&apos;rish
              </span>
              <ArrowRight className="pointer-events-none h-4 w-4" />
            </Link>
          </div>
        </Card>
      </StaggerItem>

      {/* =====================================================================
          DEEP EXPLANATION & RECENT ATTEMPTS BANNER
          ===================================================================== */}
      <StaggerItem>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                  Chuqur Savollar Tahlili va Tushuntirishlar
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Har bir xato qilgan savolingiz uchun: matndan dalil, nima uchun to&apos;g&apos;riligi, qayerda adashish mumkin bo&apos;lgani va qayta urinib ko&apos;rish imkoniyati.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/results"
              prefetch={true}
              className="relative z-20 cursor-pointer inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors"
            >
              <span className="pointer-events-none">Natijalar va Tushuntirishlar</span>
              <ArrowRight className="pointer-events-none h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      </StaggerItem>

      {/* Upcoming Modules */}
      <StaggerItem className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.upcomingHeading}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/writing"
            prefetch={true}
            className="group relative z-20 cursor-pointer flex items-center justify-between gap-4 rounded-xl border border-zinc-200/90 bg-white p-4 transition-colors hover:border-emerald-500/40 hover:shadow-sm dark:border-zinc-800/90 dark:bg-[#111113]"
          >
            <div className="pointer-events-none flex items-center gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-600/20 bg-emerald-50 text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400">
                <PenTool className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-950 dark:text-zinc-100">
                  <span>{navT.writing}</span>
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                    JONLI
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {WRITING_TESTS.length} ta Writing to&apos;plam · Split-screen · Canvas qalam · AI baholash
                </p>
              </div>
            </div>
            <div className="pointer-events-none">
              <Badge tone="emerald" mono>
                Boshlash →
              </Badge>
            </div>
          </Link>

          <Card className="flex items-center justify-between gap-4 p-4 opacity-85">
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-600/15 bg-emerald-50/50 text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <Mic className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {navT.speaking}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.speakingDesc}
                </p>
              </div>
            </div>
            <Badge tone="neutral" mono>
              {navT.soon}
            </Badge>
          </Card>
        </div>
      </StaggerItem>

      {/* Recent Examination Attempts */}
      <StaggerItem className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {t.recentHeading}
          </h2>
          {state.attempts.length > 0 && (
            <Link
              href="/dashboard/results"
              prefetch={true}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              <span>{DICT[state.lang].nav.results}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {state.attempts.length === 0 ? (
          <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
            {t.noAttempts}
          </Card>
        ) : (
          <Card className="divide-y divide-zinc-200/80 overflow-hidden dark:divide-zinc-800/80">
            {state.attempts.slice(0, 5).map((att) => {
              const meta = TEST_BY_ID[att.testId];
              const dt = new Date(att.submittedAt).toLocaleString(
                state.lang === "ru"
                  ? "ru-RU"
                  : state.lang === "uz"
                    ? "uz-UZ"
                    : "en-GB",
                {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );
              return (
                <div
                  key={att.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-emerald-50/40 dark:hover:bg-zinc-900/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-600/20 bg-emerald-500/10 text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400">
                      {att.skill === "listening" ? (
                        <Headphones className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <div className="font-semibold text-zinc-950 dark:text-zinc-100">
                        {meta?.titleEn ?? att.testId}
                      </div>
                      <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {dt} · {formatDuration(att.timeSpentSec)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {att.rawScore} / {att.total}
                    </span>
                    <Badge tone="emerald" mono className="px-2.5 py-1 text-xs">
                      Band {att.band.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </StaggerItem>
    </StaggerContainer>
  );
}
