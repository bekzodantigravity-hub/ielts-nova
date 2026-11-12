export default function StreakLoading() {
  return (
    <div className="space-y-7 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-36 rounded-full bg-emerald-500/15" />
        <div className="h-9 w-72 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-96 max-w-full rounded-md bg-zinc-100 dark:bg-zinc-800/70" />
      </div>

      {/* Main Streak Highlight Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-100/60 p-6 dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 rounded-full bg-emerald-500/20" />
              <div className="h-6 w-32 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-10 w-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-80 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/70" />
          </div>
          <div className="flex gap-4">
            <div className="h-20 w-28 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80" />
            <div className="h-20 w-28 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80" />
          </div>
        </div>
      </div>

      {/* 30-Day Preparation Roadmap Grid Skeleton */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-[#111113] sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-6 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-28 rounded-full bg-zinc-100 dark:bg-zinc-800/70" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-6 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-8 rounded bg-zinc-100 dark:bg-zinc-800/70" />
              </div>
              <div className="mt-3 h-2 w-full rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
