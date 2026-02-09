import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  label: string
  action: () => void
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Don't intercept when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (mod && e.key === 'k') {
        e.preventDefault()
        navigate('/create')
      }

      if (mod && e.key === 'l') {
        e.preventDefault()
        navigate('/agents')
      }

      if (e.key === 'Escape' && location.pathname.includes('/build/')) {
        // Dispatch a custom event that BuildProgressPage can listen for
        window.dispatchEvent(new CustomEvent('morpheus:cancel-build'))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, location.pathname])
}
