import type { Agent } from '@/types/agent'

interface FilterBarProps {
  status: Agent['status'] | ''
  onStatusChange: (status: Agent['status'] | '') => void
  category: string
  onCategoryChange: (category: string) => void
  categories: string[]
  sortBy: 'createdAt' | 'updatedAt' | 'usageCount'
  onSortChange: (sort: 'createdAt' | 'updatedAt' | 'usageCount') => void
}

export default function FilterBar({
  status,
  onStatusChange,
  category,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter */}
      <select
        value={status}
        onChange={e => onStatusChange(e.target.value as Agent['status'] | '')}
        className={selectClass}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="running">Running</option>
        <option value="stopped">Stopped</option>
        <option value="building">Building</option>
        <option value="error">Error</option>
      </select>

      {/* Category filter */}
      <select
        value={category}
        onChange={e => onCategoryChange(e.target.value)}
        className={selectClass}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Sort selector */}
      <select
        value={sortBy}
        onChange={e => onSortChange(e.target.value as 'createdAt' | 'updatedAt' | 'usageCount')}
        className={selectClass}
        aria-label="Sort agents"
      >
        <option value="updatedAt">Recently updated</option>
        <option value="createdAt">Newest first</option>
        <option value="usageCount">Most used</option>
      </select>
    </div>
  )
}
