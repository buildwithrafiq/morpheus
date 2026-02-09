import { useState } from 'react'
import { Plus, RotateCw, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import { generateApiKey } from '@/services/api-key-generator'
import { useToast } from '@/components/Toast'

interface ApiKey {
  id: string
  name: string
  maskedKey: string
  fullKey: string
  createdAt: string
  lastUsed: string | null
  rateLimit: number
}

function maskKey(key: string): string {
  if (key.length <= 8) return key
  return key.slice(0, 3) + '****************************' + key.slice(-4)
}

export default function ApiKeyManager() {
  const { addToast } = useToast()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function toggleReveal(id: string) {
    setRevealedKeys(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function copyKey(key: ApiKey) {
    navigator.clipboard.writeText(key.fullKey).catch(() => {})
    setCopiedId(key.id)
    addToast('success', 'API key copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  function createKey() {
    if (!newKeyName.trim()) return
    const id = `key-${Date.now()}`
    const fullKey = generateApiKey()
    const newKey: ApiKey = {
      id,
      name: newKeyName.trim(),
      maskedKey: maskKey(fullKey),
      fullKey,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      rateLimit: 500,
    }
    setKeys(prev => [...prev, newKey])
    setNewKeyName('')
    setShowCreateForm(false)
    setRevealedKeys(prev => new Set(prev).add(id))
    addToast('info', 'API key created. It will only be shown once — copy it now.')
  }

  function rotateKey(id: string) {
    setKeys(prev =>
      prev.map(k => {
        if (k.id !== id) return k
        const fullKey = generateApiKey()
        return {
          ...k,
          maskedKey: maskKey(fullKey),
          fullKey,
          createdAt: new Date().toISOString(),
        }
      }),
    )
    setRevealedKeys(prev => new Set(prev).add(id))
    addToast('info', 'API key rotated. Copy the new key.')
  }

  function deleteKey(id: string) {
    setKeys(prev => prev.filter(k => k.id !== id))
    setRevealedKeys(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    addToast('warning', 'API key deleted')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
          <p className="text-sm text-gray-500">Manage your API keys for agent access</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Create Key
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <label htmlFor="new-key-name" className="block text-sm font-medium text-gray-700">
            Key Name
          </label>
          <div className="mt-1 flex gap-3">
            <input
              id="new-key-name"
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Key"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={createKey}
              disabled={!newKeyName.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Generate
            </button>
            <button
              type="button"
              onClick={() => { setShowCreateForm(false); setNewKeyName('') }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {keys.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No API keys yet. Create one to get started.
          </div>
        )}
        {keys.map(key => (
          <div key={key.id} className="flex items-center justify-between px-6 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{key.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-xs text-gray-500 font-mono">
                  {revealedKeys.has(key.id) ? key.fullKey : key.maskedKey}
                </code>
                <button
                  type="button"
                  onClick={() => toggleReveal(key.id)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={revealedKeys.has(key.id) ? 'Hide key' : 'Reveal key'}
                >
                  {revealedKeys.has(key.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyKey(key)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Copy key"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {copiedId === key.id && <span className="text-xs text-green-600">Copied</span>}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Created {new Date(key.createdAt).toLocaleDateString()}
                {key.lastUsed && <> · Last used {new Date(key.lastUsed).toLocaleDateString()}</>}
                {' · '}{key.rateLimit} req/min
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => rotateKey(key.id)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label={`Rotate ${key.name}`}
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteKey(key.id)}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete ${key.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
