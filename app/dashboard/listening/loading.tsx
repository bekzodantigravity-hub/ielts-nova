export default function ListeningLoading() {
  return (
    <div className="space-y-7 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-36 rounded-full bg-emerald-500/15" />
        <div className="h-9 w-72 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-96 max-w-full rounded-md bg-zinc-100 dark:bg-zinc-800/70" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-44 rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-[#111113]"
          >
            <div className="h-6 w-32 rounded-full bg-emerald-500/15" />
            <div className="mt-4 h-6 w-60 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-6 h-10 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
