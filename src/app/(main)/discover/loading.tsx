export default function DiscoverLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 h-8 w-28 animate-pulse rounded-lg bg-muted" />
      {/* Filter panel skeleton */}
      <div className="mb-5 rounded-xl border border-border bg-card p-4">
        <div className="mb-3 h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
        <div className="mt-4 mb-3 h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-16 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      </div>
      {/* User cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
