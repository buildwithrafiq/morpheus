import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react'
import type { PipelineStage } from '@/types/pipeline'

export type StageStatus = 'pending' | 'active' | 'complete' | 'error'

interface StageInfo {
  stage: PipelineStage
  label: string
  status: StageStatus
}

interface StageIndicatorProps {
  stages: StageInfo[]
}

function StageRing({ stage }: { stage: StageInfo }) {
  const isActive = stage.status === 'active'
  const isComplete = stage.status === 'complete'
  const isError = stage.status === 'error'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-gray-200"
          />
          {/* Progress circle */}
          {isActive && (
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="176"
              className="text-indigo-600 animate-dash"
              strokeLinecap="round"
            />
          )}
          {isComplete && (
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-green-500"
            />
          )}
          {isError && (
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-red-500"
            />
          )}
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isComplete ? (
            <CheckCircle className="h-7 w-7 text-green-500" />
          ) : isError ? (
            <XCircle className="h-7 w-7 text-red-500" />
          ) : isActive ? (
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          ) : (
            <Circle className="h-7 w-7 text-gray-300" />
          )}
        </div>
      </div>
      <div className="text-center">
        <h3
          className={`text-xs font-semibold ${
            isActive
              ? 'text-indigo-600'
              : isComplete
                ? 'text-green-600'
                : isError
                  ? 'text-red-600'
                  : 'text-gray-400'
          }`}
        >
          {stage.label}
        </h3>
        {isActive && (
          <p className="mt-0.5 text-[10px] text-gray-500 animate-pulse">Processing...</p>
        )}
      </div>
    </div>
  )
}

export default function StageIndicator({ stages }: StageIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {stages.map((s, i) => (
        <div key={s.stage} className="flex items-center gap-2">
          <StageRing stage={s} />
          {i < stages.length - 1 && (
            <div
              className={`h-0.5 w-8 transition-colors duration-500 ${
                s.status === 'complete' ? 'bg-green-400' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export type { StageInfo }
