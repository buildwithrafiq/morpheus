import { Link, useNavigate } from 'react-router-dom'
import {
  Bot,
  Zap,
  Code,
  Rocket,
  Shield,
  BarChart3,
  ArrowRight,
  Sparkles,
  Store,
  CheckCircle,
  Play,
} from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'Just Talk to It',
    description: 'Describe your AI agent like you would to a colleague. No code, no config files.',
  },
  {
    icon: Zap,
    title: 'Thinks Before It Builds',
    description: 'Gemini Pro uses extended thinking to really understand what you need.',
  },
  {
    icon: Code,
    title: 'Code That Actually Works',
    description: 'Full source code, tests, and docs — generated and validated automatically.',
  },
  {
    icon: Rocket,
    title: 'Deployed in Seconds',
    description: 'Live in the cloud with API endpoints before your coffee gets cold.',
  },
  {
    icon: Shield,
    title: 'Secure Out of the Box',
    description: 'API keys, rate limiting, and input sanitization — all handled for you.',
  },
  {
    icon: BarChart3,
    title: 'See Everything',
    description: 'Requests, latency, errors, costs — all on a live dashboard you can actually read.',
  },
]

const LIVE_DEMO_DESCRIPTION =
  'A code review assistant that analyzes pull requests for bugs, security vulnerabilities, and performance issues. ' +
  'It should provide severity ratings, line-specific suggestions, and an overall quality score. ' +
  'Support JavaScript, TypeScript, and Python. Include a REST API endpoint for CI/CD integration.'

export default function HomePage() {
  const navigate = useNavigate()

  const runLiveDemo = () => {
    const buildId = `demo-${Date.now()}`
    navigate(`/build/${buildId}`, {
      state: { description: LIVE_DEMO_DESCRIPTION },
    })
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 py-24 text-center text-white">
        {/* Animated background particles */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-white blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-pink-300 blur-3xl animate-float-delayed" />
        </div>

        <div className="relative z-10">
          <div className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
            🚀 Powered by Gemini 3 Extended Thinking
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Build AI Agents with
            <span className="block bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
              Just Words
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-indigo-50">
            Stop coding. Start creating. Morpheus builds your <strong>production-ready AI agent</strong> while
            you grab coffee ☕ — API endpoints, web UI, docs, and monitoring included.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-indigo-700 shadow-2xl transition-all hover:scale-105 hover:shadow-white/20"
            >
              <Sparkles className="h-6 w-6" />
              Create Your First Agent
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button
              onClick={runLiveDemo}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-yellow-300/50 bg-yellow-400/20 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-yellow-400/30 hover:scale-105"
            >
              <Play className="h-5 w-5" />
              Try Live Build
            </button>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <Store className="h-5 w-5" />
              Browse Examples
            </Link>
          </div>

          {/* Tech badges */}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-indigo-100">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span>Gemini 3 Pro + Flash</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 text-green-300" />
              <span>Extended Thinking</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Code className="h-4 w-4 text-blue-300" />
              <span>Full Code Generation</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Gemini 3 Pipeline */}
      <section className="border-t border-gray-100 bg-gradient-to-b from-white to-indigo-50/30 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            How Gemini 3 Powers the Pipeline
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
            Five stages, two models, one prompt. Here's what happens under the hood.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-5">
            {[
              { step: '1', label: 'Analyze', detail: 'Gemini Pro with extended thinking parses your description into a structured agent spec', color: 'bg-purple-100 text-purple-700' },
              { step: '2', label: 'Design', detail: 'Pro model architects the system — prompts, data flow, tools, error handling', color: 'bg-indigo-100 text-indigo-700' },
              { step: '3', label: 'Generate', detail: 'Flash model writes production code, tests, and Dockerfile at speed', color: 'bg-blue-100 text-blue-700' },
              { step: '4', label: 'Deploy', detail: 'Agent goes live with API endpoint, health checks, and rate limiting', color: 'bg-emerald-100 text-emerald-700' },
              { step: '5', label: 'UI', detail: 'Flash generates a responsive web interface with accessibility built in', color: 'bg-amber-100 text-amber-700' },
            ].map(({ step, label, detail, color }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${color}`}>
                  {step}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900">{label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-indigo-200 bg-indigo-50/50 p-6 text-center">
            <p className="text-sm text-indigo-800">
              <span className="font-semibold">Extended Thinking</span> lets Gemini 3 Pro reason deeply about your requirements before generating anything — resulting in architecturally sound agents, not just code dumps.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Everything You Need
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
          From idea to deployed agent in minutes — no infrastructure headaches.
        </p>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                <Icon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
