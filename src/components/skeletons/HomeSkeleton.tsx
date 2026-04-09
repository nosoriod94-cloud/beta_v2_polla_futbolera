function PollaCardSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="h-20 rounded-2xl bg-muted/30 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  )
}

export default function HomeSkeleton() {
  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-7 w-16 rounded-lg bg-muted/30 animate-pulse" />
      </div>

      {/* Admin pollas section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-muted/40 animate-pulse" />
          <div className="h-8 w-24 rounded-xl bg-muted/30 animate-pulse" />
        </div>
        <PollaCardSkeleton delay={0} />
        <PollaCardSkeleton delay={60} />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/40" />

      {/* Participating pollas section */}
      <div className="space-y-3">
        <div className="h-4 w-36 rounded bg-muted/40 animate-pulse" />
        <PollaCardSkeleton delay={120} />
        <PollaCardSkeleton delay={180} />
        <PollaCardSkeleton delay={240} />
      </div>
    </div>
  )
}
