import type { Agent } from '@/types/agent'
import type { UsageMetrics } from '@/types/monitoring'
import { Activity, Square, AlertTriangle, Loader, Clock, Zap, AlertCircle } from 'lucide-react'

interface OverviewTabProps {
  agent: Agent
  metrics: UsageMetrics
}

const statusConfig: Record<Agent['status'], { label: string; color: string; icon: React.ElementType }> = {
  running: { label: 'Running', color: 'bg-green-100 text-green-700', icon: Activity },
  stopped: { label: 'Stopped', color: 'bg-gray-100 text-gray-600', icon: Square },
  error: { label: 'Error', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  building: { label: 'Building', color: 'bg-yellow-100 text-yellow-700', icon: Loader },
}

export default function OverviewTab({ agent, metrics }: OverviewTabProps) {
  const { label, color, icon: StatusIcon } = statusConfig[agent.status]

  return (
    <div className="space-y-6">
      {/* Agent Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{agent.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{agent.description}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${color}`}>
            <StatusIcon className="h-4 w-4" />
            {label}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {agent.tags.map(tag => (
            <span key={tag} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-6 text-xs text-gray-400">
          <span>Category: {agent.category}</span>
          <span>Version: {agent.currentVersion}</span>
          <span>Created: {new Date(agent.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Zap}
          label="Total Requests"
          value={metrics.totalRequests.toLocaleString()}
          color="text-indigo-600 bg-indigo-50"
        />
        <StatCard
          icon={Clock}
          label="Avg Response Time"
          value={`${metrics.avgResponseTime}ms`}
          color="text-amber-600 bg-amber-50"
        />
        <StatCard
          icon={AlertCircle}
          label="Error Rate"
          value={`${(metrics.errorRate * 100).toFixed(1)}%`}
          color="text-red-600 bg-red-50"
        />
      </div>

      {/* Token Usage */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700">Token Usage</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-400">Input Tokens</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{metrics.tokenUsage.input.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-400">Output Tokens</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{metrics.tokenUsage.output.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
