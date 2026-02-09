import { useState } from 'react'
import type { Agent } from '@/types/agent'
import { Send, Copy, Check, ExternalLink, Cpu } from 'lucide-react'
import { useServices } from '@/contexts/ServiceContext'

interface DemoTabProps {
  agent: Agent
}

interface ChatMessage {
  role: 'user' | 'agent'
  content: string
}

export default function DemoTab({ agent }: DemoTabProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const version = agent.versions[agent.currentVersion - 1]
  const publicUrl = version?.generatedUI?.publicUrl || `${window.location.origin}/demo/${agent.id}`

  const { gemini } = useServices()

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const stream = gemini.executeAgent(agent, { input: input.trim() })
      let agentResponse = ''
      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          agentResponse += chunk.content
        }
      }
      setMessages(prev => [
        ...prev,
        { role: 'agent', content: agentResponse || 'No response generated' },
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setMessages(prev => [
        ...prev,
        { role: 'agent', content: `Error: ${message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const copyShareUrl = async () => {
    await navigator.clipboard.writeText(publicUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* AI Runtime Badge */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
        <Cpu className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-amber-800">
          <span className="font-medium">AI-Powered Runtime</span> — This agent runs via Gemini {version?.architectureDoc?.selectedModel === 'gemini-3-pro' ? '3 Pro' : '3 Flash'}, using the architecture and prompts generated during build.
        </span>
      </div>

      {/* Shareable URL */}
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="flex-1 truncate text-sm text-gray-600 font-mono">{publicUrl}</span>
        <button
          type="button"
          onClick={copyShareUrl}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
          aria-label="Copy share URL"
        >
          {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {linkCopied ? 'Copied' : 'Copy URL'}
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex h-96 flex-col rounded-lg border border-gray-200 bg-white">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="py-16 text-center text-sm text-gray-400">Send a message to interact with the agent.</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-400">Thinking...</div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3">
          <form
            onSubmit={e => { e.preventDefault(); handleSend() }}
            className="flex gap-2"
          >
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
              disabled={!input.trim() || loading}
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
