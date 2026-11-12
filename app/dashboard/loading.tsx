export default function DashboardLoading() {
  return (
    <div className="space-y-7 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-100/70 p-6 dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-8">
        <div className="space-y-3 max-w-2xl">
          <div className="h-6 w-64 rounded-full bg-emerald-500/20" />
          <div className="h-10 w-96 max-w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800/70" />
          <div className="flex gap-3 pt-4">
            <div className="h-11 w-48 rounded-xl bg-emerald-600/30" />
            <div className="h-11 w-48 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>

      {/* 2-Column Hub Skeleton */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="h-56 rounded-3xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-[#111113]">
          <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-4 h-6 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-72 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/70" />
        </div>
        <div className="h-56 rounded-3xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-[#111113]">
          <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-4 h-6 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-72 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/70" />
        </div>
      </div>
    </div>
  );
}
