import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Play } from 'lucide-react'

interface DemoModeContextValue {
  isDemoMode: boolean
  enableDemo: () => void
  disableDemo: () => void
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemoMode: false,
  enableDemo: () => {},
  disableDemo: () => {},
})

export function useDemoMode() {
  return useContext(DemoModeContext)
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    return !apiKey || apiKey === 'your_key_here'
  })

  // Auto-enable demo mode if no API key is configured
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_key_here') {
      setIsDemoMode(true)
    }
  }, [])

  const enableDemo = () => setIsDemoMode(true)
  const disableDemo = () => setIsDemoMode(false)

  return (
    <DemoModeContext.Provider value={{ isDemoMode, enableDemo, disableDemo }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function DemoModeBanner() {
  const { isDemoMode, disableDemo } = useDemoMode()

  if (!isDemoMode) return null

  return (
    <div className="fixed left-0 right-0 top-0 z-50 border-b-2 border-yellow-400 bg-yellow-50 px-4 py-2">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-900">
            Demo Mode — browsing pre-built example agents (no API key required)
          </span>
        </div>
        <button
          type="button"
          onClick={disableDemo}
          className="flex items-center gap-1 text-sm font-medium text-yellow-700 hover:text-yellow-900"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Exit Demo
        </button>
      </div>
    </div>
  )
}
