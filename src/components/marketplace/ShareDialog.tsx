import { useState } from 'react'
import { X, Copy, Check, Link } from 'lucide-react'
import type { SharingConfig } from '@/types/sharing'

interface ShareDialogProps {
  agentName: string
  open: boolean
  onClose: () => void
}

type Permission = SharingConfig['permissions']

function generateShareLink(permission: Permission): string {
  const token = Math.random().toString(36).substring(2, 10)
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  return `${base}/shared/${token}?p=${permission}`
}

export default function ShareDialog({ agentName, open, onClose }: ShareDialogProps) {
  const [permission, setPermission] = useState<Permission>('view')
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const handleGenerate = () => {
    setShareLink(generateShareLink(permission))
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!shareLink) return
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const permissionOptions: { value: Permission; label: string; desc: string }[] = [
    { value: 'view', label: 'View only', desc: 'Can view the agent details' },
    { value: 'use', label: 'Use', desc: 'Can interact with the agent' },
    { value: 'fork', label: 'Fork', desc: 'Can create a copy to modify' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label={`Share ${agentName}`}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Share "{agentName}"</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Permission selector */}
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-gray-700">Permission level</legend>
          <div className="mt-2 space-y-2">
            {permissionOptions.map(opt => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  permission === opt.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="permission"
                  value={opt.value}
                  checked={permission === opt.value}
                  onChange={() => { setPermission(opt.value); setShareLink(''); setCopied(false) }}
                  className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Generate + Link display */}
        <div className="mt-5">
          {!shareLink ? (
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            >
              <Link className="h-4 w-4" />
              Generate share link
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="flex-1 truncate bg-transparent text-sm text-gray-700 focus:outline-none"
                aria-label="Share link"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Copy share link"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Attribution note (Req 16.3) */}
        <p className="mt-4 text-xs text-gray-400">
          Shared links include Morpheus platform attribution and a signup link.
        </p>
      </div>
    </div>
  )
}
