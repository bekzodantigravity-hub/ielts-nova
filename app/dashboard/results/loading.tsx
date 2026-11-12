export default function ResultsLoading() {
  return (
    <div className="space-y-7 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-full bg-emerald-500/15" />
        <div className="h-9 w-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-80 max-w-full rounded-md bg-zinc-100 dark:bg-zinc-800/70" />
      </div>

      {/* Top 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-[#111113]"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="mt-3 h-8 w-16 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-2 h-2.5 w-24 rounded bg-zinc-100 dark:bg-zinc-800/70" />
          </div>
        ))}
      </div>

      {/* Tabs & Filter Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-9 w-24 rounded-xl bg-zinc-100 dark:bg-zinc-800/70" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-zinc-100 dark:bg-zinc-800/70" />
      </div>

      {/* Question Analysis List Skeleton */}
      <div className="space-y-3 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-[#111113]">
        <div className="h-6 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-36 rounded bg-zinc-100 dark:bg-zinc-800/70" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
