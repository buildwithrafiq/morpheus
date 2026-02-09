import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ToastProvider } from '@/components/Toast'
import { DemoModeProvider } from '@/components/DemoMode'
import { createStorageService } from '@/services/storage.service'
import MainLayout from '@/layouts/MainLayout'
import HomePage from '@/pages/HomePage'
import CreateAgentPage from '@/pages/CreateAgentPage'
import BuildProgressPage from '@/pages/BuildProgressPage'
import AgentLibraryPage from '@/pages/AgentLibraryPage'
import AgentDashboardPage from '@/pages/AgentDashboardPage'
import MonitoringPage from '@/pages/MonitoringPage'
import SettingsPage from '@/pages/SettingsPage'
import MarketplacePage from '@/pages/MarketplacePage'

function renderWithRoute(initialRoute: string) {
  const mockStorage = createStorageService()
  return render(
    <ToastProvider>
      <DemoModeProvider>
        <ServiceProvider overrides={{ storage: mockStorage }}>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreateAgentPage />} />
                <Route path="/build/:id" element={<BuildProgressPage />} />
                <Route path="/agents" element={<AgentLibraryPage />} />
                <Route path="/agents/:id" element={<AgentDashboardPage />} />
                <Route path="/agents/:id/monitoring" element={<MonitoringPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ServiceProvider>
      </DemoModeProvider>
    </ToastProvider>
  )
}

describe('UI Shell Checkpoint', () => {
  describe('Page rendering', () => {
    it('renders the Home page', () => {
      renderWithRoute('/')
      expect(screen.getByText(/Build AI Agents with/)).toBeInTheDocument()
      expect(screen.getByText('Create Your First Agent')).toBeInTheDocument()
    })

    it('renders the Create Agent page', () => {
      renderWithRoute('/create')
      expect(screen.getByText('Create an AI Agent')).toBeInTheDocument()
      expect(screen.getByLabelText(/What should your agent do/i)).toBeInTheDocument()
    })

    it('renders the Build Progress page', () => {
      renderWithRoute('/build/test-build-123')
      expect(screen.getByText('Building Your Agent')).toBeInTheDocument()
      expect(screen.getByText('Build ID: test-build-123')).toBeInTheDocument()
    })

    it('renders the Agent Library page with empty state', async () => {
      renderWithRoute('/agents')
      const main = document.querySelector('main')!
      expect(within(main).getByText('My Agents')).toBeInTheDocument()
      expect(await screen.findByText('No agents found')).toBeInTheDocument()
    })

    it('renders the Agent Dashboard not-found for missing agent', async () => {
      renderWithRoute('/agents/agent-001')
      expect(await screen.findByText('Agent not found')).toBeInTheDocument()
    })

    it('renders the Monitoring page not-found for missing agent', async () => {
      renderWithRoute('/agents/agent-001/monitoring')
      expect(await screen.findByText('Agent not found')).toBeInTheDocument()
    })

    it('renders the Settings page', () => {
      renderWithRoute('/settings')
      const main = document.querySelector('main')!
      expect(within(main).getByText('Settings')).toBeInTheDocument()
      // Settings nav section labels
      const nav = screen.getByRole('navigation', { name: /Settings sections/i })
      expect(within(nav).getByText('API Keys')).toBeInTheDocument()
      expect(within(nav).getByText('Costs')).toBeInTheDocument()
      expect(within(nav).getByText('Spending Limits')).toBeInTheDocument()
      expect(within(nav).getByText('Team')).toBeInTheDocument()
    })

    it('renders the Marketplace page with empty state', async () => {
      renderWithRoute('/marketplace')
      const main = document.querySelector('main')!
      expect(within(main).getByText('Marketplace')).toBeInTheDocument()
      expect(await screen.findByText('No agents found')).toBeInTheDocument()
    })
  })

  describe('Navigation and routing', () => {
    it('renders top navigation links', () => {
      renderWithRoute('/')
      expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Create Agent/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /My Agents/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Marketplace/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument()
    })

    it('shows Morpheus branding in header', () => {
      renderWithRoute('/')
      expect(screen.getByText('Morpheus')).toBeInTheDocument()
      expect(screen.getByText('Gemini 3')).toBeInTheDocument()
    })

    it('renders agent dashboard not-found state for invalid agent', async () => {
      renderWithRoute('/agents/nonexistent-id')
      expect(await screen.findByText('Agent not found')).toBeInTheDocument()
    })
  })
})
