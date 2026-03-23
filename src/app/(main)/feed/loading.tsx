export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-7 w-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            {/* Author row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
            {/* Image */}
            <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
            {/* Actions */}
            <div className="space-y-2 px-4 py-3">
              <div className="h-6 w-16 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
