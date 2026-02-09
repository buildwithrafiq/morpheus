import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

interface AlertBannerProps {
  errorRate: number
  threshold?: number
}

export default function AlertBanner({ errorRate, threshold = 0.1 }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || errorRate <= threshold) return null

  const pct = (errorRate * 100).toFixed(1)

  return (
    <div
      role="alert"
      className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
        <p className="text-sm font-medium text-red-800">
          Error rate alert — {pct}% error rate exceeds the {(threshold * 100).toFixed(0)}% threshold over the last 5 minutes.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
