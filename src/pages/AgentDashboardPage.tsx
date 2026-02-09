import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Activity, Square, AlertTriangle, Loader, Eye, Code, FileText, GitBranch, LayoutDashboard } from 'lucide-react'
import type { Agent } from '@/types/agent'
import type { UsageMetrics } from '@/types/monitoring'
import { useServices } from '@/contexts/ServiceContext'
import { getAggregatedMetrics } from '@/services/metrics-collector'
import { getCostBreakdown } from '@/services/cost-tracker'
import OverviewTab from '@/components/dashboard/OverviewTab'
import ApiInfoTab from '@/components/dashboard/ApiInfoTab'
import DemoTab from '@/components/dashboard/DemoTab'
import DocsTab from '@/components/dashboard/DocsTab'
import VersionsTab from '@/components/dashboard/VersionsTab'
import ExportMenu from '@/components/dashboard/ExportMenu'

const tabs = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'api', label: 'API', icon: Code },
  { key: 'demo', label: 'Try It', icon: Eye },
  { key: 'docs', label: 'Docs', icon: FileText },
  { key: 'versions', label: 'Versions', icon: GitBranch },
] as const

type TabKey = (typeof tabs)[number]['key']

const statusConfig: Record<Agent['status'], { label: string; color: string; icon: React.ElementType }> = {
  running: { label: 'Running', color: 'bg-green-100 text-green-700', icon: Activity },
  stopped: { label: 'Stopped', color: 'bg-gray-100 text-gray-600', icon: Square },
  error: { label: 'Error', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  building: { label: 'Building', color: 'bg-yellow-100 text-yellow-700', icon: Loader },
}

export default function AgentDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { storage } = useServices()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    storage.getAgent(id).then(a => {
      setAgent(a)
      setLoading(false)
    })
  }, [id, storage])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Spinner className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-lg font-medium text-gray-700">Agent not found</p>
        <p className="mt-2 text-sm text-gray-400">The agent you're looking for doesn't exist or has been deleted.</p>
        <button
          type="button"
          onClick={() => navigate('/agents')}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to Library
        </button>
      </div>
    )
  }

  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000
  const aggregated = getAggregatedMetrics(agent.id, dayAgo, now)
  const costBreakdown = getCostBreakdown(agent.id)

  const metrics: UsageMetrics = {
    agentId: agent.id,
    totalRequests: aggregated.requestCount || agent.usageCount,
    avgResponseTime: aggregated.avgResponseTime,
    errorRate: aggregated.errorRate,
    tokenUsage: { input: Math.round(aggregated.totalTokens * 0.6), output: Math.round(aggregated.totalTokens * 0.4) },
    costBreakdown: costBreakdown.entries.length > 0
      ? Object.entries(costBreakdown.byCategory).map(([category, amount]) => ({
          category: category as 'api_tokens' | 'compute' | 'deployment',
          amount,
          currency: 'USD' as const,
        }))
      : [
          { category: 'api_tokens' as const, amount: 0, currency: 'USD' as const },
          { category: 'compute' as const, amount: 0, currency: 'USD' as const },
          { category: 'deployment' as const, amount: 0, currency: 'USD' as const },
        ],
  }

  const { label: statusLabel, color: statusColor, icon: StatusIcon } = statusConfig[agent.status]

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Breadcrumb + Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/agents')}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          My Agents
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
              <StatusIcon className="h-3 w-3" />
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/agents/${agent.id}/monitoring`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <BarChart3 className="h-4 w-4" />
              Monitoring
            </Link>
            <ExportMenu agentName={agent.name} />
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500">{agent.description}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Dashboard tabs">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab agent={agent} metrics={metrics} />}
      {activeTab === 'api' && <ApiInfoTab agent={agent} />}
      {activeTab === 'demo' && <DemoTab agent={agent} />}
      {activeTab === 'docs' && <DocsTab agent={agent} />}
      {activeTab === 'versions' && <VersionsTab agent={agent} />}
    </div>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
