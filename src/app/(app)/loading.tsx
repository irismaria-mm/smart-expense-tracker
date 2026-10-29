export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-card shadow-sm" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-card shadow-sm" />
    </div>
  );
}
