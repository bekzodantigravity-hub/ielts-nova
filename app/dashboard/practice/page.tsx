"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileSearch } from "lucide-react";
import { useState } from "react";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { TestCard } from "@/components/test-card";
import { btnOutline, EmptyState, PageHeader, TabBar } from "@/components/ui";
import { DICT } from "@/lib/i18n";
import { testSummary, useAppState } from "@/lib/store";
import { OFFICIAL_TESTS } from "@/lib/tests-registry";

type FilterTab = "all" | "listening" | "reading" | "in_progress" | "completed";
type SortOrder = "default" | "listening" | "reading";

export default function PracticeCatalogPage() {
  const state = useAppState();
  const t = DICT[state.lang].practice;
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortOrder>("default");

  const catalogTests = OFFICIAL_TESTS.filter((test) => test.skill !== "full");

  const summaries = Object.fromEntries(
    catalogTests.map((test) => [test.id, testSummary(state, test.id)])
  );

  const inProgCount = catalogTests.filter(
    (test) => summaries[test.id].status === "in_progress"
  ).length;
  const completedCount = catalogTests.filter(
    (test) => summaries[test.id].status === "completed"
  ).length;

  const filtered = catalogTests
    .filter((test) => {
      if (filter === "listening") return test.skill === "listening";
      if (filter === "reading") return test.skill === "reading";
      if (filter === "in_progress")
        return summaries[test.id].status === "in_progress";
      if (filter === "completed")
        return summaries[test.id].status === "completed";
      return true;
    })
    .sort((a, b) => {
      if (sort === "listening") return a.skill === "listening" ? -1 : 1;
      if (sort === "reading") return a.skill === "reading" ? -1 : 1;
      return 0;
    });

  return (
    <StaggerContainer className="space-y-6">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {/* Clean Filter Bar + Sort */}
      <StaggerItem className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TabBar<FilterTab>
          active={filter}
          onChange={setFilter}
          tabs={[
            { id: "all", label: t.all, count: catalogTests.length },
            {
              id: "listening",
              label: t.listening,
              count: catalogTests.filter((x) => x.skill === "listening").length,
            },
            {
              id: "reading",
              label: t.reading,
              count: catalogTests.filter((x) => x.skill === "reading").length,
            },
            { id: "in_progress", label: t.inProgress, count: inProgCount },
            { id: "completed", label: t.completed, count: completedCount },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            aria-label="Sort tests"
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 outline-none focus:border-emerald-600 dark:border-zinc-800 dark:bg-[#111113] dark:text-zinc-200"
          >
            <option value="default">{t.sortNewest}</option>
            <option value="listening">{t.sortListening}</option>
            <option value="reading">{t.sortReading}</option>
          </select>
        </div>
      </StaggerItem>

      {/* Clean Animated Test Cards */}
      <StaggerItem>
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <EmptyState
                icon={FileSearch}
                title={t.emptyTitle}
                description={t.emptyDesc}
                action={
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={btnOutline}
                  >
                    {t.all}
                  </button>
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key={`${filter}-${sort}`}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filtered.map((test) => (
                <div key={test.id}>
                  <TestCard test={test} state={state} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </StaggerItem>
    </StaggerContainer>
  );
}
