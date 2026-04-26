// Skeleton-Loader-Komponenten für SYSTEMS™-Dashboard.

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-4 border-b border-border/30">
    <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-48 bg-muted animate-pulse rounded" />
      <div className="h-2.5 w-32 bg-muted/60 animate-pulse rounded" />
    </div>
    <div className="h-2.5 w-16 bg-muted/60 animate-pulse rounded" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="glass-card border-border/50 overflow-hidden">
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="glass-card p-5 border-border/50 space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        <div className="h-2.5 w-20 bg-muted/60 animate-pulse rounded" />
      </div>
    </div>
    <div className="h-2 w-full bg-muted/40 animate-pulse rounded" />
    <div className="h-2 w-3/4 bg-muted/40 animate-pulse rounded" />
  </div>
);

export const SkeletonKpi = () => (
  <div className="glass-card p-5 border-border/50 space-y-3">
    <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
    <div className="h-7 w-20 bg-muted animate-pulse rounded" />
    <div className="h-2.5 w-24 bg-muted/60 animate-pulse rounded" />
  </div>
);
