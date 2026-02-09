export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-3/5 rounded bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-100" />
      </div>
      {/* Description lines */}
      <div className="mt-4 space-y-2">
        <div className="h-3.5 w-full rounded bg-gray-100" />
        <div className="h-3.5 w-4/5 rounded bg-gray-100" />
      </div>
      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-gray-100" />
        <div className="h-3 w-16 rounded bg-gray-100" />
      </div>
    </div>
  )
}
