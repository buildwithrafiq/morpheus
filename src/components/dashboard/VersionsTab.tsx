import type { Agent, AgentVersion } from '@/types/agent'
import { GitBranch, RotateCcw, Copy, CheckCircle } from 'lucide-react'

interface VersionsTabProps {
  agent: Agent
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VersionsTab({ agent }: VersionsTabProps) {
  const versions = agent.versions

  if (versions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-700">Version History</h3>
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <GitBranch className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No version history available</p>
          <p className="mt-1 text-xs text-gray-400">Versions will appear here as you iterate on your agent.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700">Version History</h3>
        <p className="mt-1 text-xs text-gray-400">
          {versions.length} version{versions.length !== 1 ? 's' : ''} — current: v{agent.currentVersion}
        </p>
      </div>

      <div className="space-y-3">
        {[...versions].reverse().map(v => (
          <VersionCard
            key={v.version}
            version={v}
            isCurrent={v.version === agent.currentVersion}
          />
        ))}
      </div>
    </div>
  )
}

function VersionCard({ version, isCurrent }: { version: AgentVersion; isCurrent: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-5 ${isCurrent ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">v{version.version}</span>
          {isCurrent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              <CheckCircle className="h-3 w-3" />
              Current
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{formatDate(version.createdAt)}</span>
      </div>

      <p className="mt-2 text-sm text-gray-500">{version.descriptionSummary}</p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={isCurrent}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Rollback to version ${version.version}`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Rollback
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          aria-label={`Fork version ${version.version}`}
        >
          <GitBranch className="h-3.5 w-3.5" />
          Fork
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          aria-label={`View version ${version.version} dashboard`}
        >
          <Copy className="h-3.5 w-3.5" />
          View
        </button>
      </div>
    </div>
  )
}
