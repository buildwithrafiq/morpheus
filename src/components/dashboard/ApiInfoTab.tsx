import { useState } from 'react'
import type { Agent } from '@/types/agent'
import { Copy, Check, Globe, Key, Shield, Gauge } from 'lucide-react'

interface ApiInfoTabProps {
  agent: Agent
}

export default function ApiInfoTab({ agent }: ApiInfoTabProps) {
  const version = agent.versions[agent.currentVersion - 1]
  const endpoint = version?.deploymentResult?.endpoint || `${window.location.origin}/api/agents/${agent.id}`

  return (
    <div className="space-y-6">
      {/* Endpoint */}
      <Section icon={Globe} title="Endpoint URL">
        <CopyBlock text={endpoint} />
      </Section>

      {/* Auth */}
      <Section icon={Key} title="Authentication">
        <p className="text-sm text-gray-500">Include your API key in the <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">Authorization</code> header as a Bearer token.</p>
        <CopyBlock text="Authorization: Bearer YOUR_API_KEY" />
      </Section>

      {/* Curl Examples */}
      <Section icon={Shield} title="Example Request">
        <CopyBlock
          text={`curl -X POST ${endpoint}/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello, how can you help me?"}'`}
        />
      </Section>

      {/* Rate Limits */}
      <Section icon={Gauge} title="Rate Limits">
        <div className="grid gap-3 sm:grid-cols-3">
          <RateCard label="Requests / min" value="60" />
          <RateCard label="Requests / hour" value="1,000" />
          <RateCard label="Max payload" value="1 MB" />
        </div>
      </Section>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg bg-gray-900 p-4">
      <pre className="flex-1 overflow-x-auto text-sm text-gray-100 whitespace-pre-wrap"><code>{text}</code></pre>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
        aria-label="Copy to clipboard"
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

function RateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 text-center">
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{label}</p>
    </div>
  )
}
