import { useMemo } from 'react'
import { Clock, DollarSign, Gauge, Activity, Zap } from 'lucide-react'
import { estimateComplexity } from '@/services/complexity-estimator'

interface ComplexityEstimatorProps {
  description: string
}

function getScoreColor(score: number): string {
  if (score <= 3) return 'text-green-600'
  if (score <= 6) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreLabel(score: number): string {
  if (score <= 3) return 'Simple'
  if (score <= 6) return 'Moderate'
  if (score <= 8) return 'Complex'
  return 'Very Complex'
}

function getScoreBarClass(score: number): string {
  if (score <= 3) return 'bg-green-500'
  if (score <= 6) return 'bg-amber-500'
  return 'bg-red-500'
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return tokens.toString()
}

export default function ComplexityEstimator({ description }: ComplexityEstimatorProps) {
  const estimate = useMemo(() => {
    if (description.length < 10) return null
    return estimateComplexity(description)
  }, [description])

  if (!estimate) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-medium text-gray-700">Complexity Estimate</h3>

      {/* Complexity score bar */}
      <div className="mt-3 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Complexity Score</span>
          <span className={`font-semibold ${getScoreColor(estimate.score)}`}>
            {estimate.score}/10 — {getScoreLabel(estimate.score)}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all duration-500 ${getScoreBarClass(estimate.score)}`}
            style={{ width: `${estimate.score * 10}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 text-indigo-500" />
          <div>
            <p className="text-xs text-gray-500">Build Time</p>
            <p className="text-sm font-semibold text-gray-900">~{estimate.buildTimeMinutes} min</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <DollarSign className="mt-0.5 h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs text-gray-500">Cost / Execution</p>
            <p className="text-sm font-semibold text-gray-900">${estimate.costPerExecution}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Gauge className="mt-0.5 h-4 w-4 text-amber-500" />
          <div>
            <p className="text-xs text-gray-500">API Quota</p>
            <p className="text-sm font-semibold text-gray-900">{estimate.apiQuotaUsage.toLocaleString()} tokens</p>
          </div>
        </div>
      </div>

      {estimate.score > 7 && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Activity className="h-3.5 w-3.5" />
          High complexity — will use multi-agent architecture with Gemini 3 Pro
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
        <Zap className="h-3.5 w-3.5" />
        This build will use ~{formatTokens(estimate.buildTokens)} tokens (~${estimate.buildCost.toFixed(3)})
      </div>
    </div>
  )
}
