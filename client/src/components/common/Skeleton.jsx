// Base shimmer block
export function Skeleton({ className = '', style }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: 'var(--border)', ...style }}
    />
  );
}

// Dashboard: Journey panel only (Timeline is sync from localStorage, no skeleton needed)
export function DashboardSkeleton() {
  return (
    <div className="card shadow-apple-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-8 rounded-md" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-24 mt-1.5" />
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
            <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Universities: 6-card grid matching the real card layout
export function UniversitiesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="card shadow-apple-sm flex flex-col overflow-hidden">
          {/* Colored top bar */}
          <Skeleton className="h-1 w-full rounded-none" />
          <div className="p-5 flex-1 space-y-3">
            {/* Name + program */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-20 rounded-full mt-1" />
              </div>
              <Skeleton className="w-6 h-6 rounded-lg flex-shrink-0" />
            </div>
            {/* Deadline + status row */}
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          {/* Action buttons row */}
          <div className="px-5 pb-4 flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-xl" />
            <Skeleton className="h-8 flex-1 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
