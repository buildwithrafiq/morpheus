import { useEffect, useRef } from 'react'
import { Rocket, CheckCircle, Loader2 } from 'lucide-react'

export interface LogEntry {
  message: string
  timestamp: string
  done: boolean
}

interface DeploymentLogProps {
  logs: LogEntry[]
  isActive: boolean
}

export default function DeploymentLog({ logs, isActive }: DeploymentLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2">
        <Rocket className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium text-gray-700">Deployment Log</span>
        {isActive && (
          <span className="ml-auto flex items-center gap-1 text-xs text-orange-500">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
            Deploying
          </span>
        )}
      </div>
      <div ref={scrollRef} className="max-h-48 overflow-y-auto p-4 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-gray-400 italic">Waiting for deployment...</p>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className="mb-1.5 flex items-start gap-2">
              {entry.done ? (
                <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
              ) : (
                <Loader2 className="mt-0.5 h-3 w-3 shrink-0 animate-spin text-gray-400" />
              )}
              <span className="text-gray-500">
                [{new Date(entry.timestamp).toLocaleTimeString()}]
              </span>
              <span className="text-gray-700">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
