import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bot, PlusCircle } from 'lucide-react'
import type { Agent } from '@/types/agent'
import { useServices } from '@/contexts/ServiceContext'
import SearchBar from '@/components/library/SearchBar'
import FilterBar from '@/components/library/FilterBar'
import AgentCard from '@/components/library/AgentCard'
import SkeletonCard from '@/components/library/SkeletonCard'

export default function AgentLibraryPage() {
  const navigate = useNavigate()
  const { storage } = useServices()

  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Agent['status'] | ''>('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'usageCount'>('updatedAt')

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try {
      const result = await storage.listAgents({
        search: search || undefined,
        status: status || undefined,
        category: category || undefined,
        sortBy,
      })
      setAgents(result)
    } finally {
      setLoading(false)
    }
  }, [storage, search, status, category, sortBy])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const [allAgents, setAllAgents] = useState<Agent[]>([])
  useEffect(() => {
    storage.listAgents().then(setAllAgents)
  }, [storage])

  const categories = useMemo(
    () => [...new Set(allAgents.map(a => a.category))].sort(),
    [allAgents],
  )

  const runningCount = allAgents.filter(a => a.status === 'running').length

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Agents</h1>
          <p className="mt-1 text-sm text-gray-500">
            {allAgents.length} agent{allAgents.length !== 1 ? 's' : ''}
            {runningCount > 0 && <span className="text-green-600"> · {runningCount} running</span>}
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          <PlusCircle className="h-4 w-4" />
          New Agent
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <SearchBar value={search} onChange={setSearch} />
        <FilterBar
          status={status}
          onStatusChange={setStatus}
          category={category}
          onCategoryChange={setCategory}
          categories={categories}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <Bot className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-600">No agents found</p>
          <p className="mt-1 text-xs text-gray-400">
            {search || status || category
              ? 'Try adjusting your search or filters.'
              : 'Create your first agent to get started.'}
          </p>
          {!search && !status && !category && (
            <Link
              to="/create"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <PlusCircle className="h-4 w-4" />
              Create Agent
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => navigate(`/agents/${agent.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
