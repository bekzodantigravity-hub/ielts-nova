"use client";

import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Headphones,
  Layers,
  Play,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { DICT, type Lang } from "@/lib/i18n";
import { type AppState, testSummary } from "@/lib/store";
import type { OfficialTest } from "@/lib/tests-registry";
import { cn } from "@/lib/utils";
import { Badge, btnOutline, btnPrimary, Card, ProgressBar } from "./ui";

export function TestCard({
  test,
  state,
}: {
  test: OfficialTest;
  state: AppState;
}) {
  const lang: Lang = state.lang;
  const t = DICT[lang].testCard;
  const summary = testSummary(state, test.id);
  const Icon = test.skill === "listening" ? Headphones : BookOpen;
  const skillLabel = test.skill === "listening" ? "Listening" : "Reading";

  const moduleHref =
    test.skill === "listening" ? "/dashboard/listening" : "/dashboard/reading";

  const ctaLabel =
    summary.status === "in_progress"
      ? t.continueTest
      : summary.status === "completed"
        ? t.retakeTest
        : t.startTest;

  return (
    <Card
      hoverLift
      className="group flex h-full flex-col justify-between overflow-hidden transition-all duration-200 hover:border-emerald-600/50 hover:shadow-lg hover:shadow-emerald-950/5 dark:hover:border-emerald-500/50 dark:hover:shadow-black/40"
    >
      {/* Clean IELTS Nova Emerald Header */}
      <div className="bg-grid-pattern border-b border-zinc-200/80 px-5 pt-4 pb-4 dark:border-zinc-800/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-zinc-950 px-2.5 py-1 font-mono text-xs font-extrabold tracking-tight text-white dark:bg-zinc-100 dark:text-zinc-950">
              {test.testNumber}
            </span>
            <Badge tone="emerald" mono>
              <Icon className="mr-1 h-3 w-3" />
              {skillLabel}
            </Badge>
          </div>

          {summary.status === "completed" ? (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t.completed}
            </span>
          ) : summary.status === "in_progress" ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t.inProgress}
            </span>
          ) : (
            <span className="font-mono text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {t.notStarted}
            </span>
          )}
        </div>

        {/* Minimal Spec Strip (Topics intentionally hidden until test start) */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">
              {test.durationMinutes}
            </span>{" "}
            {t.minutes}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">
              {test.sectionsCount}
            </span>{" "}
            {test.skill === "listening" ? t.parts : t.passages}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">
              {test.questionsCount}
            </span>{" "}
            {t.questions}
          </span>
        </div>
      </div>

      {/* Metrics & Actions */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="mb-4 rounded-lg border border-zinc-200/80 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          {summary.status === "in_progress" && summary.prog ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">
                  {t.inProgress}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.prog.answered} / {summary.prog.total} {t.answeredOf}
                </span>
              </div>
              <ProgressBar value={summary.prog.answered} max={summary.prog.total} />
            </div>
          ) : summary.latest ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t.bestBand}
                </div>
                <div className="mt-0.5 font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.bestBand?.toFixed(1)}
                </div>
              </div>
              <div className="border-x border-zinc-200 dark:border-zinc-800">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t.lastScore}
                </div>
                <div className="mt-0.5 font-mono text-base font-bold text-zinc-950 dark:text-zinc-100">
                  {summary.latest.rawScore}/40
                </div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t.attempts}
                </div>
                <div className="mt-0.5 font-mono text-base font-bold text-zinc-950 dark:text-zinc-100">
                  {summary.attempts.length}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">{t.lastScore}</span>
              <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                — / 40 ({t.notStarted})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={test.routePath}
            prefetch={true}
            className={cn(btnPrimary, "relative z-20 flex-1")}
          >
            {summary.status === "completed" ? (
              <RotateCcw className="pointer-events-none h-4 w-4" />
            ) : (
              <Play className="pointer-events-none h-4 w-4 fill-current" />
            )}
            <span className="pointer-events-none">{ctaLabel}</span>
          </Link>
          <Link
            href={moduleHref}
            prefetch={true}
            className={cn(btnOutline, "relative z-20 px-3.5")}
          >
            <span className="pointer-events-none">{t.details}</span>
            <ArrowUpRight className="pointer-events-none h-4 w-4 text-zinc-400" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
