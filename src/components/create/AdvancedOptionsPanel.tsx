import { useState } from 'react'
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import type { AdvancedOptions } from '@/types/agent'

interface AdvancedOptionsPanelProps {
  options: AdvancedOptions
  onChange: (options: AdvancedOptions) => void
}

export default function AdvancedOptionsPanel({ options, onChange }: AdvancedOptionsPanelProps) {
  const [open, setOpen] = useState(false)
  const [integrationInput, setIntegrationInput] = useState('')

  const update = (patch: Partial<AdvancedOptions>) => {
    onChange({ ...options, ...patch })
  }

  const addIntegration = () => {
    const trimmed = integrationInput.trim()
    if (!trimmed) return
    const current = options.integrationRequirements ?? []
    if (!current.includes(trimmed)) {
      update({ integrationRequirements: [...current, trimmed] })
    }
    setIntegrationInput('')
  }

  const removeIntegration = (name: string) => {
    update({
      integrationRequirements: (options.integrationRequirements ?? []).filter(i => i !== name),
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-gray-400" />
          Advanced Options
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="space-y-4 border-t border-gray-200 px-4 py-4">
          {/* Model Preference */}
          <div>
            <label htmlFor="model-preference" className="block text-sm font-medium text-gray-700">
              Model Preference
            </label>
            <select
              id="model-preference"
              value={options.modelPreference ?? ''}
              onChange={e => update({ modelPreference: (e.target.value || undefined) as AdvancedOptions['modelPreference'] })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Auto (recommended)</option>
              <option value="flash">Gemini Flash — faster, lower cost</option>
              <option value="pro">Gemini Pro — higher quality</option>
            </select>
          </div>

          {/* Max Response Time */}
          <div>
            <label htmlFor="max-response-time" className="block text-sm font-medium text-gray-700">
              Max Response Time (ms)
            </label>
            <input
              id="max-response-time"
              type="number"
              min={0}
              placeholder="e.g. 5000"
              value={options.maxResponseTime ?? ''}
              onChange={e => update({ maxResponseTime: e.target.value ? Number(e.target.value) : undefined })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Cost Constraint */}
          <div>
            <label htmlFor="cost-constraint" className="block text-sm font-medium text-gray-700">
              Cost Constraint (USD per execution)
            </label>
            <input
              id="cost-constraint"
              type="number"
              min={0}
              step={0.01}
              placeholder="e.g. 0.05"
              value={options.costConstraint ?? ''}
              onChange={e => update({ costConstraint: e.target.value ? Number(e.target.value) : undefined })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Integration Requirements */}
          <div>
            <label htmlFor="integration-input" className="block text-sm font-medium text-gray-700">
              Integration Requirements
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="integration-input"
                type="text"
                placeholder="e.g. Slack, Stripe, GitHub"
                value={integrationInput}
                onChange={e => setIntegrationInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIntegration() } }}
                className="block flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addIntegration}
                className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Add
              </button>
            </div>
            {(options.integrationRequirements ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {options.integrationRequirements!.map(name => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeIntegration(name)}
                      className="ml-0.5 text-indigo-400 hover:text-indigo-600"
                      aria-label={`Remove ${name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
