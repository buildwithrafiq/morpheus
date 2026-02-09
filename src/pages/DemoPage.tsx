import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Send, Bot, ArrowLeft, Cpu } from 'lucide-react'
import { useServices } from '@/contexts/ServiceContext'
import type { Agent } from '@/types/agent'

interface ChatMessage {
  role: 'user' | 'agent'
  content: string
}

export default function DemoPage() {
  const { id } = useParams<{ id: string }>()
  const { storage, gemini } = useServices()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!id) return
    storage.getAgent(id).then(a => { setAgent(a ?? null); setLoading(false) })
  }, [id, storage])

  const handleSend = async () => {
    if (!input.trim() || !agent) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    try {
      const stream = gemini.executeAgent(agent, { input: input.trim() })
      let response = ''
      for await (const chunk of stream) {
        if (chunk.type === 'text') response += chunk.content
      }
      setMessages(prev => [...prev, { role: 'agent', content: response || 'No response generated' }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setMessages(prev => [...prev, { role: 'agent', content: `Error: ${msg}` }])
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Bot className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-sm font-medium text-gray-600">Agent not found</p>
        <p className="mt-1 text-xs text-gray-400">It may have been deleted or the link is invalid.</p>
        <Link to="/marketplace" className="mt-4 text-sm text-indigo-600 hover:underline">Browse marketplace</Link>
      </div>
    )
  }

  const version = agent.versions[agent.currentVersion - 1]
  const model = version?.architectureDoc?.selectedModel === 'gemini-3-pro' ? 'Gemini 3 Pro' : 'Gemini 3 Flash'

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link to={`/agents/${agent.id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-sm text-gray-500">{agent.description}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
        <Cpu className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-amber-800">
          Powered by {model}
        </span>
      </div>

      <div className="flex h-[28rem] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="py-20 text-center text-sm text-gray-400">Send a message to try this agent.</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-400">Thinking...</div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-3">
          <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Chat message input"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
