export default function FullMockLoading() {
  return (
    <div className="space-y-7 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-44 rounded-full bg-emerald-500/15" />
        <div className="h-9 w-80 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-96 max-w-full rounded-md bg-zinc-100 dark:bg-zinc-800/70" />
      </div>

      {/* Main Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-100/70 p-6 dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-32 rounded-full bg-emerald-500/20" />
              <div className="h-6 w-36 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-9 w-96 max-w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-80 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/70" />
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="h-7 w-32 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80" />
              <div className="h-7 w-32 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80" />
              <div className="h-7 w-32 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80" />
            </div>
          </div>
          <div className="h-14 w-52 rounded-2xl bg-emerald-600/30" />
        </div>
      </div>

      {/* 2 Module Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-[#111113]"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800/70" />
            </div>
            <div className="mt-4 h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-2 h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800/70" />
            <div className="mt-6 h-10 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
