"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Flag,
  Headphones,
  Layers,
  Lightbulb,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import ResultsLoading from "./loading";
import {
  AnimatedNumber,
  SPRING_SNAPPY,
  SPRING_TACTILE,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";
import {
  Badge,
  btnPrimary,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  StatCard,
  TabBar,
} from "@/components/ui";
import { getQuestionExplanation } from "@/lib/explanations";
import { DICT } from "@/lib/i18n";
import { testSummary, useAppState } from "@/lib/store";
import { TEST_BY_ID } from "@/lib/tests-registry";
import { cn, formatDuration, roundBand } from "@/lib/utils";

type AnswerStatusFilter = "all" | "incorrect" | "correct" | "unanswered";

export default function ResultsAnalyticsPage() {
  return (
    <Suspense fallback={<ResultsLoading />}>
      <motion.div
        initial={{ opacity: 0, filter: "blur(5px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <ResultsAnalyticsContent />
      </motion.div>
    </Suspense>
  );
}

function ResultsAnalyticsContent() {
  const state = useAppState();
  const lang = state.lang;
  const t = DICT[lang].results;

  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    state.attempts[0]?.id ?? null
  );
  const [statusFilter, setStatusFilter] = useState<AnswerStatusFilter>("all");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [retryInputs, setRetryInputs] = useState<Record<number, string>>({});
  const [retryFeedback, setRetryFeedback] = useState<Record<number, boolean | null>>({});

  const handleVerifyRetry = (qNum: number, correctAns: string) => {
    const entered = (retryInputs[qNum] || "").trim().toLowerCase();
    const target = correctAns.trim().toLowerCase();
    const isOk =
      entered === target ||
      target.split("/").map((s) => s.trim()).includes(entered);
    setRetryFeedback((prev) => ({ ...prev, [qNum]: isOk }));
  };

  useEffect(() => {
    if (
      state.attempts.length > 0 &&
      (!selectedAttemptId ||
        !state.attempts.some((a) => a.id === selectedAttemptId))
    ) {
      setSelectedAttemptId(state.attempts[0].id);
    }
  }, [state.attempts, selectedAttemptId]);

  const listeningBest = testSummary(state, "listening-v5-t09").bestBand;
  const readingBest = testSummary(state, "reading-v5-t10").bestBand;

  const avgBand =
    state.attempts.length > 0
      ? roundBand(
          state.attempts.reduce((s, a) => s + a.band, 0) / state.attempts.length
        )
      : null;

  const activeAttempt =
    state.attempts.find((a) => a.id === selectedAttemptId) ??
    state.attempts[0] ??
    null;

  if (!activeAttempt) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.title} subtitle={t.subtitle} />
        <EmptyState
          icon={BarChart3}
          title={t.emptyTitle}
          description={t.emptyDesc}
          action={
            <Link href="/dashboard/practice" className={cn(btnPrimary, "relative z-20 cursor-pointer")}>
              <span className="pointer-events-none">{DICT[lang].nav.practice}</span>
            </Link>
          }
        />
      </div>
    );
  }

  const meta = TEST_BY_ID[activeAttempt.testId];
  const allQs = activeAttempt.questions;
  const correctCount = allQs.filter((q) => q.isCorrect).length;
  const unansweredCount = allQs.filter((q) => q.userAnswer.trim() === "").length;
  const incorrectCount = allQs.length - correctCount - unansweredCount;

  const filteredQuestions = allQs.filter((q) => {
    const empty = q.userAnswer.trim() === "";
    if (statusFilter === "correct") return q.isCorrect;
    if (statusFilter === "unanswered") return empty;
    if (statusFilter === "incorrect") return !q.isCorrect && !empty;
    return true;
  });

  return (
    <StaggerContainer className="space-y-6">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {/* Top 4 KPI Cards */}
      <StaggerItem className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Layers}
          label={t.totalAttempts}
          value={state.attempts.length}
        />
        <StatCard
          icon={Award}
          label={t.avgBand}
          value={
            avgBand !== null ? <AnimatedNumber value={avgBand} decimals={1} /> : "—"
          }
          accent
        />
        <StatCard
          icon={Headphones}
          label={t.bestListening}
          value={
            listeningBest !== null ? (
              <AnimatedNumber value={listeningBest} decimals={1} />
            ) : (
              "—"
            )
          }
        />
        <StatCard
          icon={BookOpen}
          label={t.bestReading}
          value={
            readingBest !== null ? (
              <AnimatedNumber value={readingBest} decimals={1} />
            ) : (
              "—"
            )
          }
        />
      </StaggerItem>

      {/* Attempt Selector + Section Breakdown */}
      <StaggerItem>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="attemptSelect"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                {t.selectAttempt}
              </label>
              <select
                id="attemptSelect"
                value={activeAttempt.id}
                onChange={(e) => setSelectedAttemptId(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 outline-none focus:border-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {state.attempts.map((att) => {
                  const m = TEST_BY_ID[att.testId];
                  const d = new Date(att.submittedAt).toLocaleString(
                    lang === "ru" ? "ru-RU" : lang === "uz" ? "uz-UZ" : "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );
                  return (
                    <option key={att.id} value={att.id}>
                      {m?.titleEn ?? att.testId} — Band {att.band.toFixed(1)} (
                      {att.rawScore}/40) · {d}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <Badge tone="dark" mono>
                {activeAttempt.rawScore} / {activeAttempt.total}
              </Badge>
              <Badge tone="emerald" mono className="px-2.5 py-1 text-xs">
                Band {activeAttempt.band.toFixed(1)}
              </Badge>
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {formatDuration(activeAttempt.timeSpentSec)}
              </span>
            </div>
          </div>

          {/* Per-Section Accuracy */}
          {meta && (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {meta.sections.map((sec, idx) => {
                const sc = activeAttempt.partScores[idx] ?? 0;
                const tot = activeAttempt.partTotals[idx] ?? sec.count;
                const secLabel =
                  lang === "uz"
                    ? sec.labelUz
                    : lang === "ru"
                      ? sec.labelRu
                      : sec.labelEn;
                return (
                  <div
                    key={sec.index}
                    className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {secLabel}
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {sc} / {tot}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {sec.title}
                    </div>
                    <ProgressBar value={sc} max={tot} className="mt-2 h-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </StaggerItem>

      {/* Filter Bar + 40-Question Diagnostic Table */}
      <StaggerItem className="space-y-4">
        <TabBar<AnswerStatusFilter>
          active={statusFilter}
          onChange={setStatusFilter}
          tabs={[
            { id: "all", label: t.all, count: allQs.length },
            { id: "incorrect", label: t.incorrect, count: incorrectCount },
            { id: "correct", label: t.correct, count: correctCount },
            { id: "unanswered", label: t.unanswered, count: unansweredCount },
          ]}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeAttempt.id}-${statusFilter}`}
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Card className="overflow-hidden">
              <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {filteredQuestions.map((item) => {
                  const empty = item.userAnswer.trim() === "";
                  const isExpanded = expandedQ === item.q;
                  const exp = getQuestionExplanation(
                    activeAttempt.testId,
                    item.q,
                    item.correctAnswer,
                    lang
                  );

                  return (
                    <div key={item.q} className="transition-colors">
                      <div className="flex flex-col gap-2 px-5 py-3.5 hover:bg-zinc-50/70 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-900/40">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-8 w-10 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold",
                              item.isCorrect
                                ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
                                : "border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
                            )}
                          >
                            Q{item.q}
                          </span>

                          <div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {t.yourAnswer}:{" "}
                                <strong
                                  className={cn(
                                    "font-mono",
                                    empty
                                      ? "italic text-zinc-400 dark:text-zinc-500"
                                      : item.isCorrect
                                        ? "text-emerald-700 dark:text-emerald-400"
                                        : "text-red-600 dark:text-red-400"
                                  )}
                                >
                                  {empty ? t.noAnswer : item.userAnswer}
                                </strong>
                              </span>

                              {!item.isCorrect && (
                                <span className="text-zinc-500 dark:text-zinc-400">
                                  {t.correctAnswer}:{" "}
                                  <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                                    {item.correctAnswer}
                                  </strong>
                                </span>
                              )}

                              {item.flagged && (
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-sky-600 dark:text-sky-400">
                                  <Flag className="h-3 w-3" />
                                  Flagged
                                </span>
                              )}
                            </div>

                            {item.note && (
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {t.noteLabel}
                                </span>{" "}
                                {item.note}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedQ(isExpanded ? null : item.q)
                            }
                            className={cn(
                              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                              isExpanded
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "border border-emerald-600/25 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/80 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                            )}
                          >
                            <Lightbulb className="h-3.5 w-3.5" />
                            <span>
                              {isExpanded
                                ? lang === "uz"
                                  ? "Yopish"
                                  : lang === "ru"
                                    ? "Скрыть"
                                    : "Collapse"
                                : lang === "uz"
                                  ? "Tushuntirish"
                                  : lang === "ru"
                                    ? "Объяснение"
                                    : "Explanation"}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {item.isCorrect ? (
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
                              <X className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable Explanation Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden border-t border-zinc-200/70 bg-emerald-500/5 p-4 dark:border-zinc-800 dark:bg-emerald-500/5 sm:p-5"
                          >
                            <div className="space-y-3">
                              {/* Evidence Quote */}
                              <div className="rounded-xl border border-emerald-600/25 bg-white/80 p-3 text-xs dark:border-emerald-500/30 dark:bg-zinc-900/80">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>
                                    {lang === "uz"
                                      ? "Matndan / Audio transkriptdan dalil:"
                                      : lang === "ru"
                                        ? "Цитата из текста / аудио:"
                                        : "Contextual Evidence Quote:"}
                                  </span>
                                </div>
                                <p className="mt-1 font-serif italic text-zinc-700 dark:text-zinc-300">
                                  {exp.evidence}
                                </p>
                              </div>

                              {/* Why this answer is correct */}
                              <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                                <div className="font-bold text-zinc-950 dark:text-zinc-100">
                                  💡{" "}
                                  {lang === "uz"
                                    ? "Nima uchun bu javob to'g'ri?"
                                    : lang === "ru"
                                      ? "Почему этот ответ правильный?"
                                      : "Why is this answer correct?"}
                                </div>
                                <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-400">
                                  {lang === "uz"
                                    ? exp.whyCorrectUz
                                    : lang === "ru"
                                      ? exp.whyCorrectRu
                                      : exp.whyCorrectEn}
                                </p>
                              </div>

                              {/* Trap / Distractor explanation */}
                              <div className="rounded-xl border border-sky-500/25 bg-sky-50/60 p-3 text-xs dark:border-sky-500/25 dark:bg-sky-950/30">
                                <div className="font-bold text-sky-950 dark:text-sky-300">
                                  ✦{" "}
                                  {lang === "uz"
                                    ? "Qayerda adashish mumkin edi? (Chalg'ituvchi omillar)"
                                    : lang === "ru"
                                      ? "Где можно было ошибиться? (Дистракторы)"
                                      : "Common Trap & Distractor Breakdown"}
                                </div>
                                <p className="mt-1 leading-relaxed text-sky-900/90 dark:text-sky-200/90">
                                  {lang === "uz"
                                    ? exp.mistakeTrapUz
                                    : lang === "ru"
                                      ? exp.mistakeTrapRu
                                      : exp.mistakeTrapEn}
                                </p>
                              </div>

                              {/* Strategy Tip */}
                              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/40">
                                <div className="font-bold text-zinc-900 dark:text-zinc-200">
                                  🎯{" "}
                                  {lang === "uz"
                                    ? "IELTS imtihon ko'nikmasi:"
                                    : lang === "ru"
                                      ? "Стратегический совет IELTS:"
                                      : "Exam Strategy Tip:"}
                                </div>
                                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                                  {lang === "uz"
                                    ? exp.skillTipUz
                                    : lang === "ru"
                                      ? exp.skillTipRu
                                      : exp.skillTipEn}
                                </p>
                              </div>

                              {/* Interactive Re-attempt Box */}
                              <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/15">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span>
                                    {lang === "uz"
                                      ? "Qayta urinish: Savolni mustahkamlang"
                                      : lang === "ru"
                                        ? "Повторная попытка: Закрепите навык"
                                        : "Interactive Retry: Reinforce Learning"}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                                  {lang === "uz"
                                    ? "Tushuntirishni o'qib, to'g'ri javobni yozing va o'zingizni tekshiring:"
                                    : lang === "ru"
                                      ? "Прочитав объяснение, введите правильный ответ и проверьте себя:"
                                      : "After reading the explanation, type your revised answer and verify:"}
                                </p>

                                <div className="mt-2.5 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={retryInputs[item.q] || ""}
                                    onChange={(e) =>
                                      setRetryInputs((prev) => ({
                                        ...prev,
                                        [item.q]: e.target.value,
                                      }))
                                    }
                                    placeholder={
                                      lang === "uz"
                                        ? "To'g'ri javobni kiriting..."
                                        : lang === "ru"
                                          ? "Введите правильный ответ..."
                                          : "Type your answer..."
                                    }
                                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleVerifyRetry(
                                        item.q,
                                        item.correctAnswer
                                      )
                                    }
                                    className="btn-sheen shrink-0 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                                  >
                                    {lang === "uz"
                                      ? "Tekshirish"
                                      : lang === "ru"
                                        ? "Проверить"
                                        : "Check"}
                                  </button>
                                </div>

                                {retryFeedback[item.q] !== undefined &&
                                  retryFeedback[item.q] !== null && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ duration: 0.15 }}
                                      className={cn(
                                        "mt-2 flex items-center gap-1.5 rounded-lg p-2 text-xs font-bold",
                                        retryFeedback[item.q]
                                          ? "bg-emerald-600/20 text-emerald-900 dark:text-emerald-200"
                                          : "bg-red-500/20 text-red-900 dark:text-red-200"
                                      )}
                                    >
                                      {retryFeedback[item.q] ? (
                                        <>
                                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                          <span>
                                            {lang === "uz"
                                              ? "Barakalla! Endi to'g'ri topdingiz. Tushuntirishni to'liq o'zlashtirdingiz!"
                                              : lang === "ru"
                                                ? "Отлично! Теперь ответ верный. Вы поняли ошибку!"
                                                : "Excellent! You got it right and understood the logic!"}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                          <span>
                                            {lang === "uz"
                                              ? "Hali ham noaniq. Yuqoridagi tushuntirish va dalilni yana bir bor diqqat bilan o'qing."
                                              : lang === "ru"
                                                ? "Пока неверно. Внимательно перечитайте цитату и объяснение выше."
                                                : "Not quite yet. Please review the context quote and explanation above."}
                                          </span>
                                        </>
                                      )}
                                    </motion.div>
                                  )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </StaggerItem>
    </StaggerContainer>
  );
}
