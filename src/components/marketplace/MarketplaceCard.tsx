import { GitFork, Users, Tag, Loader2 } from 'lucide-react'

export interface MarketplaceAgent {
  id: string
  name: string
  description: string
  category: string
  usageCount: number
  author: string
  tags: string[]
}

interface MarketplaceCardProps {
  agent: MarketplaceAgent
  onFork: (id: string) => void
  forking?: boolean
}

export default function MarketplaceCard({ agent, onFork, forking }: MarketplaceCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{agent.name}</h3>
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          <Tag className="h-3 w-3" />
          {agent.category}
        </span>
      </div>

      {/* Description */}
      <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-2">{agent.description}</p>

      {/* Tags */}
      {agent.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {agent.tags.slice(0, 3).map(tag => (
            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {agent.usageCount.toLocaleString()} uses
          </span>
          <span>by {agent.author}</span>
        </div>
        <button
          type="button"
          onClick={() => onFork(agent.id)}
          disabled={forking}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Fork ${agent.name}`}
        >
          {forking ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Forking…
            </>
          ) : (
            <>
              <GitFork className="h-3.5 w-3.5" />
              Fork
            </>
          )}
        </button>
      </div>
    </div>
  )
}
