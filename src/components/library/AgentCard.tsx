import type { Agent } from '@/types/agent'
import { Activity, Square, AlertTriangle, Loader } from 'lucide-react'

interface AgentCardProps {
  agent: Agent
  onClick: () => void
}

const statusConfig: Record<Agent['status'], { label: string; color: string; icon: React.ElementType }> = {
  running: { label: 'Running', color: 'bg-green-100 text-green-700', icon: Activity },
  stopped: { label: 'Stopped', color: 'bg-gray-100 text-gray-600', icon: Square },
  error: { label: 'Error', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  building: { label: 'Building', color: 'bg-yellow-100 text-yellow-700', icon: Loader },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  const { label, color, icon: StatusIcon } = statusConfig[agent.status]

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={`View ${agent.name}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{agent.name}</h3>
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
          <StatusIcon className="h-3 w-3" />
          {label}
        </span>
      </div>

      {/* Description */}
      <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-2">{agent.description}</p>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-gray-400">
        <span>Created {formatDate(agent.createdAt)}</span>
        <span className="ml-auto">{agent.usageCount.toLocaleString()} uses</span>
      </div>
    </button>
  )
}
