import { useState } from 'react'
import { Key, DollarSign, Gauge, Users, ChevronRight, Zap } from 'lucide-react'
import ApiKeyManager from '@/components/settings/ApiKeyManager'
import CostDashboard from '@/components/settings/CostDashboard'
import SpendingLimits from '@/components/settings/SpendingLimits'
import TeamManager from '@/components/settings/TeamManager'
import MockModeToggle from '@/components/settings/MockModeToggle'

const sections = [
  { key: 'build-mode', label: 'Build Mode', description: 'Mock vs Real API', icon: Zap },
  { key: 'api-keys', label: 'API Keys', description: 'Manage access keys', icon: Key },
  { key: 'costs', label: 'Costs', description: 'Usage and billing', icon: DollarSign },
  { key: 'spending', label: 'Spending Limits', description: 'Budget controls', icon: Gauge },
  { key: 'team', label: 'Team', description: 'Members and roles', icon: Users },
] as const

type SectionKey = (typeof sections)[number]['key']

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('build-mode')

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your platform configuration</p>
      </div>

      <div className="flex gap-8">
        {/* Left nav */}
        <nav className="w-56 shrink-0" aria-label="Settings sections">
          <ul className="space-y-1">
            {sections.map(section => {
              const Icon = section.icon
              const isActive = activeSection === section.key
              return (
                <li key={section.key}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{section.label}</p>
                      <p className={`text-xs ${isActive ? 'text-indigo-500' : 'text-gray-400'}`}>
                        {section.description}
                      </p>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 shrink-0 text-indigo-400" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            {activeSection === 'build-mode' && <MockModeToggle />}
            {activeSection === 'api-keys' && <ApiKeyManager />}
            {activeSection === 'costs' && <CostDashboard />}
            {activeSection === 'spending' && <SpendingLimits />}
            {activeSection === 'team' && <TeamManager />}
          </div>
        </div>
      </div>
    </div>
  )
}
