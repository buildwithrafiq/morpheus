import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Home,
  PlusCircle,
  Bot,
  Store,
  Settings,
  Sparkles,
} from 'lucide-react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useDemoMode } from '@/components/DemoMode'

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const modKey = isMac ? '⌘' : 'Ctrl+'

const shortcutHints: Record<string, string> = {
  '/create': `${modKey}K`,
  '/agents': `${modKey}L`,
}

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/agents', label: 'My Agents', icon: Bot },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function MainLayout() {
  useKeyboardShortcuts()
  const { isDemoMode } = useDemoMode()
  const location = useLocation()

  // Don't show the top nav on the homepage — it has its own hero
  const isHome = location.pathname === '/'

  return (
    <div className={`flex min-h-screen flex-col bg-gray-50 ${isDemoMode ? 'pt-10' : ''}`}>
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Morpheus</span>
            <span className="hidden rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 sm:inline">
              Gemini 3
            </span>
          </NavLink>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                {shortcutHints[to] && (
                  <kbd className="ml-1 hidden rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-[9px] text-gray-400 lg:inline">
                    {shortcutHints[to]}
                  </kbd>
                )}
              </NavLink>
            ))}
          </nav>

          {/* CTA */}
          <NavLink
            to="/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Create Agent</span>
          </NavLink>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer — minimal */}
      {isHome && (
        <footer className="border-t border-gray-200 bg-white px-6 py-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-gray-400">
            <span>Morpheus AI Platform — Powered by Gemini 3 Pro + Flash</span>
            <span>Built for the Gemini 3 Hackathon</span>
          </div>
        </footer>
      )}
    </div>
  )
}
