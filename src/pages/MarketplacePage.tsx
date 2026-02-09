import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Store, Sparkles, TrendingUp, Star } from 'lucide-react'
import { MARKETPLACE_TEMPLATES } from '@/constants/marketplace-templates'
import { useServices } from '@/contexts/ServiceContext'
import { useToast } from '@/components/Toast'
import MarketplaceCard from '@/components/marketplace/MarketplaceCard'
import type { Agent } from '@/types/agent'

const FEATURED_IDS = new Set(['mkt-email-drafter', 'mkt-diagram-to-code', 'mkt-code-reviewer'])
function toCard(l: (typeof MARKETPLACE_TEMPLATES)[number]) {
  return { id: l.agentId, name: l.name, description: l.description, category: l.category, usageCount: l.usageCount, author: l.authorName, tags: l.tags }
}
const allAgents = MARKETPLACE_TEMPLATES.map(toCard)
const featuredAgents = allAgents.filter(a => FEATURED_IDS.has(a.id))
const CC: Record<string, string> = {
  'Customer Service': 'bg-blue-50 text-blue-700 border-blue-200', 'Data & Analytics': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Content: 'bg-orange-50 text-orange-700 border-orange-200', 'Developer Tools': 'bg-violet-50 text-violet-700 border-violet-200',
  Productivity: 'bg-amber-50 text-amber-700 border-amber-200', Business: 'bg-rose-50 text-rose-700 border-rose-200',
  Accessibility: 'bg-teal-50 text-teal-700 border-teal-200', 'HR & People': 'bg-pink-50 text-pink-700 border-pink-200',
  Education: 'bg-sky-50 text-sky-700 border-sky-200', Design: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  DevOps: 'bg-slate-50 text-slate-700 border-slate-200', Sales: 'bg-lime-50 text-lime-700 border-lime-200',
  Finance: 'bg-cyan-50 text-cyan-700 border-cyan-200', Research: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

function mkAgent(l: (typeof MARKETPLACE_TEMPLATES)[number]): Agent {
  const now = new Date().toISOString()
  const id = () => crypto.randomUUID()
  const [s, a, c, d, u] = [id(), id(), id(), id(), id()]
  return {
    id: `fork-${l.agentId}-${Date.now()}`, name: l.name, description: l.description, tags: [...l.tags],
    category: l.category, status: 'stopped', currentVersion: 1, createdAt: now, updatedAt: now,
    usageCount: 0, ownerId: 'local-user', sharing: { isPublic: false, permissions: 'view' },
    versions: [{ version: 1, createdAt: now, descriptionSummary: `Forked: ${l.name}`,
      agentSpec: { id: s, corePurpose: l.description, inputRequirements: [{ name: 'input', type: 'text', required: true, description: 'User input' }], outputRequirements: [{ name: 'response', type: 'string', description: 'Agent response' }], dataSources: [], integrations: [], edgeCases: [{ description: 'Empty input', mitigation: 'Return helpful prompt' }], personality: { tone: 'professional', formality: 'neutral', verbosity: 'balanced' }, communicationStyle: 'conversational', complexityScore: 5, inferredFields: [] },
      architectureDoc: { id: a, agentSpecId: s, selectedModel: 'gemini-3-flash', promptStrategy: { systemPrompt: `You are a ${l.name}.`, fewShotExamples: [], outputFormat: 'text' }, dataFlow: [{ step: 1, name: 'process', input: 'user_input', output: 'response', description: 'Process' }], stateManagement: { type: 'stateless', storage: 'none' }, tools: [], conversationFlow: [{ id: 'start', type: 'start', next: ['process'] }, { id: 'process', type: 'process', next: ['end'] }, { id: 'end', type: 'end', next: [] }], errorHandling: { retryPolicy: { maxRetries: 2, backoffMs: 1000 }, fallbackBehavior: 'Return error message' } },
      codeBundle: { id: c, architectureDocId: a, files: [{ path: 'src/agent.ts', content: '// Forked — customize me', language: 'typescript' }], dependencies: { '@google/genai': '^1.0.0' }, testResults: [], debugIterations: 0, validated: false },
      deploymentResult: { id: d, codeBundleId: c, provider: 'local', status: 'stopped', endpoint: `${window.location.origin}/api/agents/fork-${l.agentId}-${Date.now()}`, healthCheckPassed: false, envVars: [], deploymentTime: 0, fallbackUsed: false },
      generatedUI: { id: u, deploymentResultId: d, publicUrl: `${window.location.origin}/demo/fork-${l.agentId}`, components: [], accessibilityScore: 0, responsive: true },
    }],
  }
}

export default function MarketplacePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [forking, setForking] = useState<string | null>(null)
  const { storage } = useServices()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const categories = useMemo(() => [...new Set(allAgents.map(a => a.category))].sort(), [])
  const filtered = useMemo(() => {
    let r = allAgents
    if (search) { const q = search.toLowerCase(); r = r.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q))) }
    if (category) r = r.filter(a => a.category === category)
    return r
  }, [search, category])
  const handleFork = async (id: string) => {
    const listing = MARKETPLACE_TEMPLATES.find(l => l.agentId === id)
    if (!listing || forking) return
    setForking(id)
    try { const agent = mkAgent(listing); await storage.saveAgent(agent); addToast('success', `Forked "${listing.name}" to your library`); navigate(`/agents/${agent.id}`) }
    catch { addToast('error', 'Failed to fork agent. Please try again.') }
    finally { setForking(null) }
  }
  const showFeatured = !search && !category
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600"><Sparkles className="h-5 w-5 text-white" /></div><div><h1 className="text-2xl font-bold text-gray-900">Marketplace</h1><p className="text-sm text-gray-500">{allAgents.length} ready-made agents — fork, customize, and deploy</p></div></div></div>
      {showFeatured && (<div className="mb-8"><div className="mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-indigo-600" /><h2 className="text-sm font-semibold text-gray-700">Popular this week</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{featuredAgents.map(agent => (<div key={agent.id} className="relative"><div className="absolute -top-2 right-3 z-10 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 shadow-sm"><Star className="h-3 w-3" />Featured</div><MarketplaceCard agent={agent} onFork={handleFork} forking={forking === agent.id} /></div>))}</div></div>)}
      {showFeatured && (<div className="mb-6 border-t border-gray-100 pt-6"><h2 className="mb-3 text-sm font-semibold text-gray-700">Browse all agents</h2></div>)}
      <div className="relative mb-4"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="search" placeholder="Search agents by name, description, or tag…" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Search marketplace" /></div>
      <div className="mb-6 flex flex-wrap gap-2"><button type="button" onClick={() => setCategory('')} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${!category ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>All</button>{categories.map(c => (<button key={c} type="button" onClick={() => setCategory(category === c ? '' : c)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${category === c ? 'bg-indigo-600 text-white' : `border ${CC[c] ?? 'bg-white text-gray-600 border-gray-300'} hover:opacity-80`}`}>{c}</button>))}</div>
      {filtered.length === 0 ? (<div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center"><Store className="h-12 w-12 text-gray-300" /><p className="mt-4 text-sm font-medium text-gray-600">No agents match your search</p><p className="mt-1 text-xs text-gray-400">Try different keywords or clear the category filter.</p></div>) : (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(agent => (<MarketplaceCard key={agent.id} agent={agent} onFork={handleFork} forking={forking === agent.id} />))}</div>)}
      <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400"><span>{allAgents.length} agents</span><span>·</span><span>{categories.length} categories</span><span>·</span><span>{allAgents.reduce((s, a) => s + a.usageCount, 0).toLocaleString()} total forks</span></div>
    </div>
  )
}
