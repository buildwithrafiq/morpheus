import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp } from 'lucide-react'
import type { Agent } from '@/types/agent'
import { useServices } from '@/contexts/ServiceContext'
import { getCostBreakdown, getUserCostSummary } from '@/services/cost-tracker'

const USER_ID = 'user-001'

interface AgentCost {
  agentId: string
  agentName: string
  apiTokens: number
  compute: number
  deployment: number
  total: number
}

export default function CostDashboard() {
  const { storage } = useServices()
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    storage.listAgents().then(setAgents)
  }, [storage])

  const userSummary = getUserCostSummary(USER_ID)

  const agentCosts: AgentCost[] = agents.map(a => {
    const breakdown = getCostBreakdown(a.id)
    return {
      agentId: a.id,
      agentName: a.name,
      apiTokens: breakdown.byCategory.api_tokens,
      compute: breakdown.byCategory.compute,
      deployment: breakdown.byCategory.deployment,
      total: breakdown.totalCost,
    }
  })

  const totalCost = userSummary.totalCost
  const projectedCost = userSummary.projectedMonthlyCost

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Cost Dashboard</h3>
        <p className="text-sm text-gray-500">Current billing period usage and projections</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Period</p>
              <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Projected Monthly</p>
              <p className="text-2xl font-bold text-gray-900">${projectedCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost breakdown table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-3">
          <h4 className="text-sm font-semibold text-gray-900">Cost Breakdown by Agent</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Agent</th>
                <th className="px-6 py-3 text-right">API Tokens</th>
                <th className="px-6 py-3 text-right">Compute</th>
                <th className="px-6 py-3 text-right">Deployment</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agentCosts.map(cost => (
                <tr key={cost.agentId} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{cost.agentName}</td>
                  <td className="px-6 py-3 text-right text-gray-600">${cost.apiTokens.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right text-gray-600">${cost.compute.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right text-gray-600">${cost.deployment.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">${cost.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-900">Total</td>
                <td className="px-6 py-3 text-right font-medium text-gray-900">
                  ${agentCosts.reduce((s, c) => s + c.apiTokens, 0).toFixed(2)}
                </td>
                <td className="px-6 py-3 text-right font-medium text-gray-900">
                  ${agentCosts.reduce((s, c) => s + c.compute, 0).toFixed(2)}
                </td>
                <td className="px-6 py-3 text-right font-medium text-gray-900">
                  ${agentCosts.reduce((s, c) => s + c.deployment, 0).toFixed(2)}
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-900">${totalCost.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
