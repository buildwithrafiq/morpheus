import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

const iconColors: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(toast => {
          const Icon = icons[toast.type]
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${colors[toast.type]}`}
              role="alert"
            >
              <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${iconColors[toast.type]}`} />
              <p className="flex-1 text-sm">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
