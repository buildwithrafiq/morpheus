import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export interface MetricsTimePoint {
  time: string
  requests: number
  p50: number
  p95: number
  p99: number
  errorRate: number
  inputTokens: number
  outputTokens: number
}

interface MetricsChartsProps {
  timeRange: string
  data: MetricsTimePoint[]
}

export default function MetricsCharts({ timeRange: _timeRange, data }: MetricsChartsProps) {
  const chartCard = (title: string, children: React.ReactNode) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="h-52">{children}</div>
    </div>
  )

  const emptyState = (
    <div className="flex h-full items-center justify-center text-sm text-gray-400">
      No data available
    </div>
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Request Volume */}
      {chartCard(
        'Request Volume',
        data.length === 0 ? emptyState : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} name="Requests" />
          </AreaChart>
        </ResponsiveContainer>
        ),
      )}

      {/* Latency Percentiles */}
      {chartCard(
        'Latency Percentiles (ms)',
        data.length === 0 ? emptyState : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend verticalAlign="top" height={28} />
            <Line type="monotone" dataKey="p50" stroke="#22c55e" strokeWidth={2} dot={false} name="p50" />
            <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} name="p95" />
            <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} name="p99" />
          </LineChart>
        </ResponsiveContainer>
        ),
      )}

      {/* Error Rate */}
      {chartCard(
        'Error Rate',
        data.length === 0 ? emptyState : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
            <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} />
            <Area type="monotone" dataKey="errorRate" stroke="#ef4444" fill="#fef2f2" strokeWidth={2} name="Error Rate" />
          </AreaChart>
        </ResponsiveContainer>
        ),
      )}

      {/* Token Consumption */}
      {chartCard(
        'Token Consumption',
        data.length === 0 ? emptyState : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend verticalAlign="top" height={28} />
            <Area type="monotone" dataKey="inputTokens" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} name="Input Tokens" />
            <Area type="monotone" dataKey="outputTokens" stroke="#8b5cf6" fill="#f5f3ff" strokeWidth={2} name="Output Tokens" />
          </AreaChart>
        </ResponsiveContainer>
        ),
      )}
    </div>
  )
}
