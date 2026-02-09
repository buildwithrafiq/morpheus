import { useState, useEffect } from 'react'
import { AlertTriangle, Save } from 'lucide-react'
import { checkSpendingLimit, setSpendingLimit } from '@/services/cost-tracker'
import { useToast } from '@/components/Toast'

const USER_ID = 'user-001'

interface SpendingLimitItem {
  id: string
  label: string
  limit: number
  currentUsage: number
}

export default function SpendingLimits() {
  const { addToast } = useToast()
  const [limits, setLimits] = useState<SpendingLimitItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    const result = checkSpendingLimit(USER_ID)
    setLimits([
      {
        id: 'monthly',
        label: 'Monthly Spending Limit',
        limit: result.limit === Infinity ? 100 : result.limit,
        currentUsage: result.currentSpend,
      },
    ])
  }, [])

  function startEdit(limit: SpendingLimitItem) {
    setEditingId(limit.id)
    setEditValue(String(limit.limit))
  }

  function saveEdit(id: string) {
    const val = parseFloat(editValue)
    if (isNaN(val) || val <= 0) return
    setSpendingLimit(USER_ID, val)
    setLimits(prev => prev.map(l => (l.id === id ? { ...l, limit: val } : l)))
    setEditingId(null)
    addToast('success', 'Spending limit updated')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Spending Limits</h3>
        <p className="text-sm text-gray-500">Configure budget limits to control costs</p>
      </div>

      <div className="space-y-4">
        {limits.map(limit => {
          const pct = limit.limit > 0 ? Math.min((limit.currentUsage / limit.limit) * 100, 100) : 0
          const isWarning = pct >= 80
          const isEditing = editingId === limit.id

          return (
            <div key={limit.id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{limit.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    ${limit.currentUsage.toFixed(2)} of ${limit.limit.toFixed(2)} used
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isWarning && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      {pct >= 100 ? 'Limit reached' : 'Approaching limit'}
                    </span>
                  )}
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">$</span>
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        min="1"
                        step="1"
                        aria-label={`Edit ${limit.label}`}
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(limit.id)}
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(limit)}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Usage bar */}
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 100
                        ? 'bg-red-500'
                        : pct >= 80
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                    }`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={limit.currentUsage}
                    aria-valuemin={0}
                    aria-valuemax={limit.limit}
                    aria-label={`${limit.label} usage`}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-gray-400">{pct.toFixed(0)}%</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
