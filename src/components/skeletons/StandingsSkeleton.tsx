export default function StandingsSkeleton() {
  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-8 w-52 rounded-lg bg-muted/40 animate-pulse" />
          <div className="h-3 w-28 rounded bg-muted/30 animate-pulse" />
        </div>
        <div className="h-10 w-12 rounded-lg bg-muted/30 animate-pulse" />
      </div>

      {/* Podium — 3 cards */}
      <div className="grid grid-cols-3 gap-2">
        {[150, 180, 130].map((h, i) => (
          <div
            key={i}
            className="rounded-2xl bg-muted/30 animate-pulse"
            style={{ height: h, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 px-1">
        <div className="h-px flex-1 bg-border/40" />
        <div className="h-3 w-10 rounded bg-muted/30 animate-pulse" />
        <div className="h-px flex-1 bg-border/40" />
      </div>

      {/* List rows */}
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="rounded-xl border border-border/40 bg-card/40 px-4 py-3 flex items-center gap-3 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="w-7 h-5 rounded bg-muted/40 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-24 rounded bg-muted/40" />
            <div className="h-1.5 w-full rounded-full bg-muted/30" />
          </div>
          <div className="h-8 w-10 rounded bg-muted/40 shrink-0" />
        </div>
      ))}
    </div>
  )
}
