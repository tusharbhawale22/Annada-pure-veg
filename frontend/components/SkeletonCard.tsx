/**
 * components/SkeletonCard.tsx — Loading skeleton for menu cards
 */
export function SkeletonMenuCard() {
  return (
    <div className="card overflow-hidden flex flex-col animate-pulse">
      <div className="p-4 pb-0 flex justify-center">
        <div className="w-36 h-36 rounded-full skeleton-shimmer" />
      </div>
      <div className="p-4 pt-3 space-y-2">
        <div className="h-4 skeleton-shimmer rounded mx-auto w-3/4" />
        <div className="h-3 skeleton-shimmer rounded w-full" />
        <div className="h-3 skeleton-shimmer rounded w-5/6" />
        <div className="flex justify-between items-center mt-3">
          <div className="h-6 w-16 skeleton-shimmer rounded" />
          <div className="h-9 w-20 skeleton-shimmer rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMenuCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card animate-pulse space-y-3">
      <div className="h-4 skeleton-shimmer rounded w-1/2" />
      <div className="h-8 skeleton-shimmer rounded w-2/3" />
      <div className="h-3 skeleton-shimmer rounded w-3/4" />
    </div>
  );
}
