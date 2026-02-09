import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { RequestLog } from '@/types/monitoring'

interface RequestLogTableProps {
  logs: RequestLog[]
  pageSize?: number
}

export default function RequestLogTable({ logs, pageSize = 50 }: RequestLogTableProps) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize))
  const start = page * pageSize
  const pageLogs = logs.slice(start, start + pageSize)

  const statusColor = (code: number) => {
    if (code >= 500) return 'bg-red-100 text-red-700'
    if (code >= 400) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Latency</th>
              <th className="px-4 py-3">Tokens</th>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Response</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(log.statusCode)}`}>
                    {log.statusCode}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{log.latency}ms</td>
                <td className="px-4 py-2.5 text-gray-600">{log.tokenCount}</td>
                <td className="max-w-[200px] truncate px-4 py-2.5 text-gray-500" title={log.request}>
                  {log.request}
                </td>
                <td className="max-w-[200px] truncate px-4 py-2.5 text-gray-500" title={log.response}>
                  {log.response}
                </td>
              </tr>
            ))}
            {pageLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No request logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-500">
          Showing {logs.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, logs.length)} of {logs.length} entries
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-xs text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
