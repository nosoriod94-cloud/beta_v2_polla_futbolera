function MatchRowSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="rounded-xl border border-border/40 bg-card/40 p-3 space-y-2 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Date */}
      <div className="h-3 w-28 rounded bg-muted/30" />
      {/* Teams + toggle */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-10 rounded-xl bg-muted/30" />
        <div className="w-16 h-10 rounded-xl bg-muted/20" />
        <div className="flex-1 h-10 rounded-xl bg-muted/30" />
      </div>
    </div>
  )
}

function JornadaSkeleton({ matchCount, delay }: { matchCount: number; delay: number }) {
  return (
    <div className="space-y-2" style={{ animationDelay: `${delay}ms` }}>
      {/* Jornada header */}
      <div className="flex items-center justify-between py-1 animate-pulse" style={{ animationDelay: `${delay}ms` }}>
        <div className="h-5 w-36 rounded bg-muted/40" />
        <div className="h-4 w-16 rounded bg-muted/30" />
      </div>
      {/* Match rows */}
      <div className="space-y-2">
        {Array.from({ length: matchCount }).map((_, i) => (
          <MatchRowSkeleton key={i} delay={delay + i * 50} />
        ))}
      </div>
    </div>
  )
}

export default function PredictionsSkeleton() {
  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="pt-4 space-y-1.5">
        <div className="h-9 w-44 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-3 w-32 rounded bg-muted/30 animate-pulse" />
      </div>

      {/* Jornadas */}
      <JornadaSkeleton matchCount={3} delay={0} />
      <JornadaSkeleton matchCount={3} delay={120} />
      <JornadaSkeleton matchCount={2} delay={240} />
    </div>
  )
}
