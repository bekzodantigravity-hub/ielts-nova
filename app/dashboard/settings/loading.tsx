export default function SettingsLoading() {
  return (
    <div className="space-y-7 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-36 rounded-full bg-emerald-500/15" />
        <div className="h-9 w-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-80 max-w-full rounded-md bg-zinc-100 dark:bg-zinc-800/70" />
      </div>
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-[#111113] space-y-6">
        <div className="h-10 w-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/70" />
          <div className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/70" />
        </div>
        <div className="h-16 rounded-2xl bg-emerald-500/10" />
      </div>
    </div>
  );
}
