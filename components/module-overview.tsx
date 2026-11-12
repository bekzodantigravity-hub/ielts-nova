"use client";

import { useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Headphones,
  Layers,
  Play,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { DICT } from "@/lib/i18n";
import { testSummary, useAppState } from "@/lib/store";
import {
  ActiveSkill,
  LISTENING_BAND_TABLE,
  OFFICIAL_TESTS,
  READING_BAND_TABLE,
  TEST_BY_ID,
  type TestId,
} from "@/lib/tests-registry";
import { cn, formatDuration } from "@/lib/utils";
import {
  AnimatedNumber,
  SPRING_SNAPPY,
  StaggerContainer,
  StaggerItem,
} from "./motion";
import {
  Badge,
  btnOutline,
  btnPrimary,
  Card,
  PageHeader,
  ProgressBar,
} from "./ui";

export function ModuleOverview({
  testId = "l-v5-t1",
  skill,
}: {
  testId?: TestId;
  skill?: ActiveSkill;
}) {
  const state = useAppState();
  const lang = state.lang;
  const t = DICT[lang].module;
  const tc = DICT[lang].testCard;

  const resolvedInitialTest = TEST_BY_ID[testId] || OFFICIAL_TESTS[0];
  const activeSkill = skill || resolvedInitialTest.skill;
  const skillTests = OFFICIAL_TESTS.filter((x) => x.skill === activeSkill);

  const [currentId, setCurrentId] = useState<TestId>(testId);
  const test = TEST_BY_ID[currentId] || skillTests[0] || resolvedInitialTest;
  const summary = testSummary(state, test.id);
  const Icon = test.skill === "listening" ? Headphones : BookOpen;
  const bandTable =
    test.skill === "listening" ? LISTENING_BAND_TABLE : READING_BAND_TABLE;

  const primaryCta =
    summary.status === "in_progress"
      ? t.continueFull
      : summary.status === "completed"
        ? t.retakeFull
        : t.launchFull;

  return (
    <StaggerContainer className="space-y-6">
      {/* Test Selector Strip */}
      <StaggerItem>
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-xs dark:border-zinc-800/80 dark:bg-[#111113]">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <span className="font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {activeSkill === "listening" ? "Listening" : "Reading"} ({skillTests.length} Tests)
            </span>
            <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Active: {test.testNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {skillTests.map((st) => {
              const stSummary = testSummary(state, st.id);
              const isSelected = st.id === test.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setCurrentId(st.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                      : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-600/40 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      stSummary.status === "completed"
                        ? "bg-emerald-400"
                        : stSummary.status === "in_progress"
                          ? "bg-sky-400"
                          : isSelected
                            ? "bg-white/80"
                            : "bg-zinc-400 dark:bg-zinc-600"
                    )}
                  />
                  <span>{st.testNumber}</span>
                </button>
              );
            })}
          </div>
        </div>
      </StaggerItem>

      <PageHeader
        eyebrow={`${test.testNumber} · ${activeSkill === "listening" ? "Listening" : "Reading"}`}
        title={`${test.testNumber} — ${activeSkill === "listening" ? "Listening" : "Reading"}`}
        subtitle={`${test.questionsCount} ${tc.questions} · ${test.sectionsCount} ${test.skill === "listening" ? tc.parts : tc.passages} · ${test.durationMinutes} ${tc.minutes}`}
        actions={
          <Link href={test.routePath} className={cn(btnPrimary, "relative z-20 cursor-pointer")}>
            {summary.status === "completed" ? (
              <RotateCcw className="pointer-events-none h-4 w-4" />
            ) : (
              <Play className="pointer-events-none h-4 w-4 fill-current" />
            )}
            <span className="pointer-events-none">{primaryCta}</span>
          </Link>
        }
      />

      {/* Top Spec Strip */}
      <StaggerItem className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card hoverLift className="p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{tc.minutes}</span>
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            <AnimatedNumber value={test.durationMinutes} />
            {test.extraCheckMinutes ? ` + ${test.extraCheckMinutes}` : ""}
          </div>
        </Card>

        <Card hoverLift className="p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{test.skill === "listening" ? tc.parts : tc.passages}</span>
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            <AnimatedNumber value={test.sectionsCount} />
          </div>
        </Card>

        <Card hoverLift className="p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{tc.questions}</span>
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            <AnimatedNumber value={test.questionsCount} />
          </div>
        </Card>

        <Card hoverLift className="p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{tc.bestBand}</span>
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary.bestBand !== null ? (
              <AnimatedNumber value={summary.bestBand} decimals={1} />
            ) : (
              "—"
            )}
          </div>
        </Card>
      </StaggerItem>

      {/* Main 3-Column Grid: Paper Structure (2 cols) + Official Band Table (1 col) */}
      <StaggerItem className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800/80">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                {t.overview}
              </h2>
            </div>

            <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {test.sections.map((sec, idx) => {
                const label =
                  lang === "uz"
                    ? sec.labelUz
                    : lang === "ru"
                      ? sec.labelRu
                      : sec.labelEn;
                const qTypes =
                  lang === "uz"
                    ? sec.questionTypesUz
                    : lang === "ru"
                      ? sec.questionTypesRu
                      : sec.questionTypesEn;

                const latestSecScore = summary.latest?.partScores?.[idx];
                const latestSecTotal =
                  summary.latest?.partTotals?.[idx] ?? sec.count;

                return (
                  <div key={sec.index} className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Badge tone="dark" mono>
                          {label}
                        </Badge>
                        <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                          {sec.title}
                        </h3>
                      </div>
                      <Badge tone="emerald" mono>
                        {sec.range} ({sec.count})
                      </Badge>
                    </div>

                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                      {qTypes}
                    </p>

                    {latestSecScore !== undefined && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {tc.lastScore}
                          </span>
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {latestSecScore} / {latestSecTotal}
                          </span>
                        </div>
                        <ProgressBar
                          value={latestSecScore}
                          max={latestSecTotal}
                          className="h-1.5"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Attempt History for this Paper */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800/80">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                {t.yourHistory}
              </h2>
              {summary.attempts.length > 0 && (
                <Link
                  href="/dashboard/results"
                  className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  {DICT[lang].nav.results} &rarr;
                </Link>
              )}
            </div>

            {summary.attempts.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
                {t.noHistory}
              </div>
            ) : (
              <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {summary.attempts.map((att) => {
                  const dt = new Date(att.submittedAt).toLocaleString(
                    lang === "ru" ? "ru-RU" : lang === "uz" ? "uz-UZ" : "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );
                  return (
                    <div
                      key={att.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <div className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {dt}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                            {t.timeTaken}: {formatDuration(att.timeSpentSec)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {att.rawScore} / 40
                        </span>
                        <Badge tone="emerald" mono>
                          Band {att.band.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Official Band Conversion Table */}
        <div>
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800/80">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                {t.bandTable}
              </h2>
            </div>

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400">
                  <th className="px-5 py-2.5 font-semibold">{t.rawScore}</th>
                  <th className="px-5 py-2.5 text-right font-semibold">
                    {t.bandScore}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 font-mono text-xs dark:divide-zinc-800/70">
                {bandTable.map((row) => (
                  <tr
                    key={row.band}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  >
                    <td className="px-5 py-2.5 text-zinc-700 dark:text-zinc-300">
                      {row.raw} / 40
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {row.band}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-zinc-200/80 p-4 dark:border-zinc-800/80">
              <Link href="/dashboard/practice" className={cn(btnOutline, "relative z-20 cursor-pointer w-full")}>
                <span className="pointer-events-none">{DICT[lang].nav.practice}</span>
              </Link>
            </div>
          </Card>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}
