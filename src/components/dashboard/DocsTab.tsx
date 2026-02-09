import { useState } from 'react'
import type { Agent } from '@/types/agent'
import { Copy, Check } from 'lucide-react'

interface DocsTabProps {
  agent: Agent
}

type Language = 'curl' | 'javascript' | 'python'

const languages: { key: Language; label: string }[] = [
  { key: 'curl', label: 'curl' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'python', label: 'Python' },
]

function generateExamples(endpoint: string): Record<Language, string> {
  return {
    curl: `curl -X POST ${endpoint}/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello"}'`,

    javascript: `const response = await fetch("${endpoint}/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ message: "Hello" }),
});

const data = await response.json();
console.log(data.response);`,

    python: `import requests

response = requests.post(
    "${endpoint}/chat",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json",
    },
    json={"message": "Hello"},
)

data = response.json()
print(data["response"])`,
  }
}

export default function DocsTab({ agent }: DocsTabProps) {
  const [lang, setLang] = useState<Language>('curl')
  const [copied, setCopied] = useState(false)

  const version = agent.versions[agent.currentVersion - 1]
  const endpoint = version?.deploymentResult?.endpoint || `${window.location.origin}/api/agents/${agent.id}`
  const examples = generateExamples(endpoint)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(examples[lang])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* API Reference */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700">API Reference</h3>
        <div className="mt-4 space-y-3">
          <EndpointRow method="POST" path="/chat" description="Send a message and receive a response" />
          <EndpointRow method="GET" path="/health" description="Check agent health status" />
          <EndpointRow method="GET" path="/info" description="Get agent metadata and capabilities" />
        </div>
      </div>

      {/* Code Examples */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Code Examples</h3>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Language selector">
            {languages.map(l => (
              <button
                key={l.key}
                type="button"
                role="tab"
                aria-selected={lang === l.key}
                onClick={() => { setLang(l.key); setCopied(false) }}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  lang === l.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4 rounded-lg bg-gray-900 p-4">
          <pre className="overflow-x-auto text-sm text-gray-100 whitespace-pre-wrap"><code>{examples[lang]}</code></pre>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-3 right-3 rounded p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
            aria-label="Copy code example"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Request / Response Schema */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700">Request Body</h3>
        <div className="mt-3 rounded-lg bg-gray-50 p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap"><code>{JSON.stringify({
  message: { type: 'string', required: true, description: 'User message or question' },
  orderId: { type: 'string', required: false, description: 'Optional order ID for tracking' },
}, null, 2)}</code></pre>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-gray-700">Response Body</h3>
        <div className="mt-3 rounded-lg bg-gray-50 p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap"><code>{JSON.stringify({
  response: { type: 'string', description: 'Agent response text' },
  suggestedActions: { type: 'string[]', description: 'Follow-up action suggestions' },
}, null, 2)}</code></pre>
        </div>
      </div>
    </div>
  )
}

function EndpointRow({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColor = method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
      <span className={`rounded px-2 py-0.5 text-xs font-bold ${methodColor}`}>{method}</span>
      <code className="text-sm font-mono text-gray-800">{path}</code>
      <span className="ml-auto text-xs text-gray-400">{description}</span>
    </div>
  )
}
