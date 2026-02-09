import { useEffect, useRef, useState } from 'react'
import { Brain } from 'lucide-react'

interface ThinkingStreamProps {
  tokens: string[]
  isActive: boolean
  actualThinkingTokens?: number
}

const keyDecisionPatterns = [
  /selecting/i,
  /choosing/i,
  /determining/i,
  /decided/i,
  /optimal/i,
  /strategy/i,
  /finalizing/i,
]

function isKeyDecision(token: string): boolean {
  return keyDecisionPatterns.some(p => p.test(token))
}

function useAnimatedCounter(target: number, duration = 1000): number {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    if (target === prevTarget.current) return
    const startVal = prevTarget.current
    prevTarget.current = target
    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.floor(startVal + (target - startVal) * progress))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])

  return count
}

function getDepthLabel(count: number): string {
  if (count > 30000) return 'DEEP'
  if (count > 20000) return 'Advanced'
  return 'Standard'
}

function getDepthBarClass(count: number): string {
  if (count > 30000) return 'bg-gradient-to-r from-purple-500 to-pink-500'
  if (count > 20000) return 'bg-gradient-to-r from-indigo-500 to-purple-500'
  return 'bg-indigo-400'
}

export default function ThinkingStream({ tokens, isActive, actualThinkingTokens }: ThinkingStreamProps) {
  const streamEndRef = useRef<HTMLDivElement>(null)
  // Use actual token count from Gemini API when available, fall back to estimate while streaming
  const rawTokenCount = actualThinkingTokens && actualThinkingTokens > 0
    ? actualThinkingTokens
    : tokens.length * 150
  const tokenCount = useAnimatedCounter(rawTokenCount)
  const isActualCount = (actualThinkingTokens ?? 0) > 0

  useEffect(() => {
    if (typeof streamEndRef.current?.scrollIntoView === 'function') {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [tokens])

  return (
    <div className="space-y-3">
      {/* Token counter + depth indicator */}
      {tokens.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Extended Thinking Active</p>
              <p className="font-mono text-2xl font-bold text-indigo-600">
                {tokenCount.toLocaleString()} tokens
              </p>
              <p className="text-xs text-gray-400">
                {isActualCount ? 'from Gemini API' : 'estimated while streaming'}
              </p>
            </div>
            <Brain className="h-12 w-12 text-indigo-400 animate-pulse" />
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Thinking Depth</span>
              <span className={tokenCount > 20000 ? 'font-bold text-purple-600' : ''}>
                {getDepthLabel(tokenCount)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all duration-500 ${getDepthBarClass(tokenCount)}`}
                style={{ width: `${Math.min((tokenCount / 35000) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Thinking stream */}
      <div className="rounded-lg border border-gray-200 bg-gray-900 text-sm">
        <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-2">
          <Brain className="h-4 w-4 text-purple-400" />
          <span className="font-medium text-gray-200">Thinking Stream</span>
          {isActive && (
            <span className="ml-auto flex items-center gap-1 text-xs text-purple-400">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
              Streaming
            </span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
          {tokens.length === 0 ? (
            <p className="italic text-gray-500">Waiting for thinking tokens...</p>
          ) : (
            tokens.map((token, i) => (
              <p
                key={i}
                className={`mb-1 animate-fade-in ${
                  isKeyDecision(token)
                    ? 'font-semibold text-yellow-300'
                    : 'text-gray-400'
                }`}
              >
                {isKeyDecision(token) && <span className="mr-1 text-yellow-500">★</span>}
                {token}
              </p>
            ))
          )}
          <div ref={streamEndRef} />
        </div>
      </div>
    </div>
  )
}
