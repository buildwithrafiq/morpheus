import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ToastProvider } from '@/components/Toast'
import { DemoModeProvider, DemoModeBanner } from '@/components/DemoMode'
import { MockModeBanner } from '@/components/MockModeBanner'
import ErrorBoundary from '@/components/ErrorBoundary'
import MainLayout from '@/layouts/MainLayout'
import HomePage from '@/pages/HomePage'
import CreateAgentPage from '@/pages/CreateAgentPage'
import BuildProgressPage from '@/pages/BuildProgressPage'
import AgentLibraryPage from '@/pages/AgentLibraryPage'
import AgentDashboardPage from '@/pages/AgentDashboardPage'
import MonitoringPage from '@/pages/MonitoringPage'
import SettingsPage from '@/pages/SettingsPage'
import MarketplacePage from '@/pages/MarketplacePage'
import SharedAgentPage from '@/pages/SharedAgentPage'
import DemoPage from '@/pages/DemoPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DemoModeProvider>
          <ServiceProvider>
            <DemoModeBanner />
            <MockModeBanner />
            <BrowserRouter>
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
                  <Route path="/shared/:token" element={<SharedAgentPage />} />
                  <Route path="/demo/:id" element={<DemoPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ServiceProvider>
        </DemoModeProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
