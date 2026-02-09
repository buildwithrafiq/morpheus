import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Share2, ArrowRight, Eye, Play, GitFork } from 'lucide-react'

const PERMISSION_INFO = {
  view: { label: 'View only', icon: Eye, description: 'You can view this agent\'s details and configuration.' },
  use: { label: 'Use', icon: Play, description: 'You can interact with this agent and test it out.' },
  fork: { label: 'Fork', icon: GitFork, description: 'You can create your own copy of this agent and customize it.' },
} as const

export default function SharedAgentPage() {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const permission = (searchParams.get('p') ?? 'view') as keyof typeof PERMISSION_INFO
  const info = PERMISSION_INFO[permission] ?? PERMISSION_INFO.view
  const Icon = info.icon

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
        <Share2 className="h-7 w-7 text-white" />
      </div>

      <h1 className="mt-6 text-2xl font-bold text-gray-900">Shared Agent</h1>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
        <Icon className="h-4 w-4" />
        {info.label} access
      </div>

      <p className="mt-4 max-w-md text-sm text-gray-500">
        {info.description}
      </p>

      <p className="mt-2 text-xs text-gray-400">
        Share token: {token}
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Browse Marketplace
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Go Home
        </Link>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        Powered by Morpheus — build AI agents with Gemini
      </p>
    </div>
  )
}
