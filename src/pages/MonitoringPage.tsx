import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { Agent } from '@/types/agent'
import type { UsageMetrics, RequestLog } from '@/types/monitoring'
import { useServices } from '@/contexts/ServiceContext'
import { getAggregatedMetrics, getMetrics } from '@/services/metrics-collector'
import AlertBanner from '@/components/monitoring/AlertBanner'
import MetricsCharts from '@/components/monitoring/MetricsCharts'
import type { MetricsTimePoint } from '@/components/monitoring/MetricsCharts'
import RequestLogTable from '@/components/monitoring/RequestLogTable'

const TIME_RANGES: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
}
const TIME_RANGE_KEYS = Object.keys(TIME_RANGES)

export default function MonitoringPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { storage } = useServices()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<string>('24h')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    storage.getAgent(id).then(a => {
      setAgent(a)
      setLoading(false)
    })
  }, [id, storage])

  const { metrics, requestLogs, timeSeriesData } = useMemo(() => {
    if (!agent) return { metrics: null, requestLogs: [], timeSeriesData: [] as MetricsTimePoint[] }

    const now = Date.now()
    const rangeMs = TIME_RANGES[timeRange] ?? TIME_RANGES['24h']!
    const startTime = now - rangeMs
    const aggregated = getAggregatedMetrics(agent.id, startTime, now)
    const rawEvents = getMetrics(agent.id, startTime, now)

    const metricsData: UsageMetrics = {
      agentId: agent.id,
      totalRequests: aggregated.requestCount || agent.usageCount,
      avgResponseTime: aggregated.avgResponseTime,
      errorRate: aggregated.errorRate,
      tokenUsage: {
        input: Math.round(aggregated.totalTokens * 0.6),
        output: Math.round(aggregated.totalTokens * 0.4),
      },
      costBreakdown: [],
    }

    const logs: RequestLog[] = rawEvents.map((e, i) => ({
      id: `log-${i}`,
      agentId: agent.id,
      timestamp: new Date(e.timestamp).toISOString(),
      statusCode: e.statusCode,
      latency: e.latency,
      tokenCount: e.tokenCount,
      request: `Request at ${new Date(e.timestamp).toLocaleTimeString()}`,
      response: `Response (${e.statusCode})`,
    }))

    const bucketCount = { '1h': 12, '6h': 36, '24h': 48, '7d': 56 }[timeRange] ?? 24
    const bucketSize = rangeMs / bucketCount
    const timeSeries: MetricsTimePoint[] = []

    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = startTime + i * bucketSize
      const bucketEnd = bucketStart + bucketSize
      const bucketEvents = rawEvents.filter(e => e.timestamp >= bucketStart && e.timestamp < bucketEnd)
      const time = new Date(bucketStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const requests = bucketEvents.length
      const errors = bucketEvents.filter(e => e.statusCode >= 400).length
      const errorRate = requests > 0 ? errors / requests : 0
      const latencies = bucketEvents.map(e => e.latency).sort((a, b) => a - b)
      const pct = (sorted: number[], p: number) => {
        if (sorted.length === 0) return 0
        const idx = Math.ceil(p * sorted.length) - 1
        return sorted[Math.max(0, idx)]!
      }
      timeSeries.push({
        time, requests,
        p50: pct(latencies, 0.5), p95: pct(latencies, 0.95), p99: pct(latencies, 0.99),
        errorRate,
        inputTokens: Math.round(bucketEvents.reduce((s, e) => s + e.tokenCount, 0) * 0.6),
        outputTokens: Math.round(bucketEvents.reduce((s, e) => s + e.tokenCount, 0) * 0.4),
      })
    }

    const hasAnyData = rawEvents.length > 0
    return { metrics: metricsData, requestLogs: logs, timeSeriesData: hasAnyData ? timeSeries : [] }
  }, [agent, timeRange])

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
        <button type="button" onClick={() => navigate('/agents')}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Back to Library
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/agents/${agent.id}`)}
            className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            aria-label="Back to agent dashboard"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {agent.name}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
        </div>

        {/* Time range selector */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="Time range">
          {TIME_RANGE_KEYS.map(range => (
            <button
              key={range}
              type="button"
              role="radio"
              aria-checked={timeRange === range}
              onClick={() => setTimeRange(range)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <AlertBanner errorRate={metrics?.errorRate ?? 0} />
      <MetricsCharts timeRange={timeRange} data={timeSeriesData} />
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Request Logs</h2>
        <RequestLogTable logs={requestLogs} />
      </div>
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
