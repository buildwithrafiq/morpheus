import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { XCircle, RotateCcw, ArrowLeft, AlertTriangle, Timer, Trophy, Share2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { PipelineStage } from '@/types/pipeline'
import type { GeneratedFile, TestResult } from '@/types/agent'
import { useServices } from '@/contexts/ServiceContext'
import { useToast } from '@/components/Toast'
import StageIndicator, { type StageInfo, type StageStatus } from '@/components/build/StageIndicator'
import ThinkingStream from '@/components/build/ThinkingStream'
import CodePreview from '@/components/build/CodePreview'
import DeploymentLog, { type LogEntry } from '@/components/build/DeploymentLog'
import RateLimitGame from '@/components/build/RateLimitGame'

const STAGES: { stage: PipelineStage; label: string }[] = [
  { stage: 'analyzing', label: 'Analyzing Requirements' },
  { stage: 'designing', label: 'Designing Architecture' },
  { stage: 'generating', label: 'Generating Code' },
  { stage: 'deploying', label: 'Deploying Agent' },
  { stage: 'creating-ui', label: 'Creating Interface' },
]

const STAGE_FLAVOR: Record<PipelineStage, string> = {
  'analyzing': '🧠 Reading your mind... (analyzing requirements)',
  'designing': '🏗️ Drawing up the blueprints... (designing architecture)',
  'generating': '⚡ Writing code faster than any human... (generating implementation)',
  'deploying': '🚀 Launching into orbit... (deploying to cloud)',
  'creating-ui': '🎨 Making it look pretty... (creating interface)',
}

type BuildStatus = 'idle' | 'running' | 'complete' | 'error' | 'cancelled'

function formatBuildTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const tenths = Math.floor((ms % 1000) / 100)
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`
}

export default function BuildProgressPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { pipeline, gemini } = useServices()
  const { addToast } = useToast()

  const buildState = location.state as { description?: string; advancedOptions?: Record<string, unknown> } | null

  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [stageStatuses, setStageStatuses] = useState<StageStatus[]>(
    STAGES.map((_, i) => (i === 0 ? 'active' : 'pending'))
  )
  const [thinkingTokens, setThinkingTokens] = useState<string[]>([])
  const [totalThinkingTokens, setTotalThinkingTokens] = useState(0)
  const [codeFiles, setCodeFiles] = useState<GeneratedFile[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [deployLogs, setDeployLogs] = useState<LogEntry[]>([])
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle')
  const [buildTime, setBuildTime] = useState(0)
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0)
  const cancelledRef = useRef(false)
  const buildIdRef = useRef<string | null>(null)
  const startTimeRef = useRef(Date.now())
  const hasStartedRef = useRef(false)

  const description = buildState?.description ?? 'A helpful AI assistant'

  const runPipeline = useCallback(async () => {
    if (!pipeline) return
    cancelledRef.current = false
    setBuildStatus('running')
    startTimeRef.current = Date.now()

    try {
      const stream = pipeline.startBuild(description, buildState?.advancedOptions)

      for await (const event of stream) {
        if (cancelledRef.current) break

        const stageIdx = STAGES.findIndex(s => s.stage === event.stage)
        if (stageIdx >= 0) {
          setCurrentStageIndex(stageIdx)
          setStageStatuses(prev =>
            prev.map((s, i) => {
              if (i < stageIdx) return 'complete'
              if (i === stageIdx) return 'active'
              return s
            })
          )
        }

        if (!buildIdRef.current && typeof event.data === 'object' && event.data !== null && 'buildId' in event.data) {
          buildIdRef.current = (event.data as { buildId: string }).buildId
        }

        switch (event.type) {
          case 'thinking':
            setThinkingTokens(prev => [...prev, String(event.data)])
            break
          case 'test-result':
            if (Array.isArray(event.data)) {
              setTestResults(event.data as TestResult[])
            }
            break
          case 'complete':
            setStageStatuses(prev =>
              prev.map((s, i) => (i === stageIdx ? 'complete' : s))
            )
            if (event.tokenMetadata) {
              setTotalThinkingTokens(prev => prev + event.tokenMetadata!.thoughtsTokenCount)
            }
            if (event.stage === 'generating' && typeof event.data === 'object' && event.data !== null) {
              const bundle = event.data as { files?: GeneratedFile[]; testResults?: TestResult[] }
              if (bundle.files) setCodeFiles(bundle.files)
              if (bundle.testResults) setTestResults(bundle.testResults)
            }
            if (event.stage === 'deploying' && typeof event.data === 'object' && event.data !== null) {
              const result = event.data as { endpoint?: string; provider?: string }
              setDeployLogs(prev => [
                ...prev,
                {
                  message: `Deployed to ${result.provider ?? 'cloud'}: ${result.endpoint ?? 'endpoint ready'}`,
                  timestamp: new Date().toISOString(),
                  done: true,
                },
              ])
            }
            break
          case 'progress':
            if (event.stage === 'deploying') {
              setDeployLogs(prev => [
                ...prev,
                {
                  message: String(event.data),
                  timestamp: new Date().toISOString(),
                  done: false,
                },
              ])
            }
            break
          case 'error':
            setStageStatuses(prev =>
              prev.map((s, i) => (i === stageIdx ? 'error' : s))
            )
            addToast('error', `Build failed at ${STAGES[stageIdx]?.label ?? 'unknown stage'}: ${typeof event.data === 'object' && event.data !== null && 'message' in event.data ? (event.data as { message: string }).message : String(event.data)}`)
            setBuildStatus('error')
            return
        }
      }

      if (!cancelledRef.current) {
        setStageStatuses(prev => prev.map(() => 'complete'))
        setBuildStatus('complete')
        addToast('success', 'Agent built and deployed successfully!')
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setBuildStatus('error')
        addToast('error', `Build failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  }, [pipeline, description, buildState?.advancedOptions, addToast])

  // Start pipeline once on mount — hasStartedRef prevents double-run
  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    runPipeline()
    return () => { cancelledRef.current = true }
  }, [runPipeline])

  // Live build timer
  useEffect(() => {
    if (buildStatus !== 'running') return
    const timer = setInterval(() => {
      setBuildTime(Date.now() - startTimeRef.current)
    }, 100)
    return () => clearInterval(timer)
  }, [buildStatus])

  // Poll rate limit wait from Gemini service
  useEffect(() => {
    if (buildStatus !== 'running') { setRateLimitSeconds(0); return }
    const poll = setInterval(() => {
      const svc = gemini as { rateLimitWaitSeconds?: number }
      setRateLimitSeconds(svc.rateLimitWaitSeconds ?? 0)
    }, 500)
    return () => clearInterval(poll)
  }, [buildStatus, gemini])

  // Confetti on successful build
  useEffect(() => {
    if (buildStatus === 'complete') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    }
  }, [buildStatus])

  // Listen for Escape key cancel
  useEffect(() => {
    const onCancelBuild = () => {
      if (buildStatus === 'running') handleCancel()
    }
    window.addEventListener('morpheus:cancel-build', onCancelBuild)
    return () => window.removeEventListener('morpheus:cancel-build', onCancelBuild)
  })

  const handleCancel = () => {
    cancelledRef.current = true
    if (buildIdRef.current && pipeline) {
      pipeline.cancelBuild(buildIdRef.current)
    }
    setBuildStatus('cancelled')
    setStageStatuses(prev =>
      prev.map((s, i) => (i === currentStageIndex ? 'error' : s))
    )
  }

  const handleRetry = () => {
    setThinkingTokens([])
    setTotalThinkingTokens(0)
    setCodeFiles([])
    setTestResults([])
    setDeployLogs([])
    setStageStatuses(STAGES.map((_, i) => (i === 0 ? 'active' : 'pending')))
    setCurrentStageIndex(0)
    setBuildTime(0)
    hasStartedRef.current = false
    cancelledRef.current = false
    runPipeline()
  }

  const shareAgentCreation = async () => {
    const text = `I just built an AI agent in ${formatBuildTime(buildTime)} using Morpheus! 🚀`
    if (navigator.share) {
      await navigator.share({ title: 'Morpheus AI', text, url: window.location.href })
    } else {
      await navigator.clipboard.writeText(text)
      addToast('success', 'Copied to clipboard!')
    }
  }

  const stages: StageInfo[] = STAGES.map((s, i) => ({
    ...s,
    status: stageStatuses[i] ?? 'pending',
  }))

  const currentStage = STAGES[currentStageIndex]?.stage
  const isGenerating = currentStage === 'generating'
  const isDeploying = currentStage === 'deploying'
  const isRunning = buildStatus === 'running'

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/create')}
            className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Create
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Building Your Agent</h1>
          <p className="mt-1 text-sm text-gray-500">Build ID: {id}</p>
          {isRunning && currentStage && (
            <p className="mt-2 text-sm font-medium text-indigo-600">
              {STAGE_FLAVOR[currentStage]}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isRunning && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              Cancel
              <kbd className="ml-1 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 font-mono text-[10px] text-red-400">Esc</kbd>
            </button>
          )}
          {(buildStatus === 'error' || buildStatus === 'cancelled') && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Build
            </button>
          )}
        </div>
      </div>

      {/* Stage progress bar */}
      <div className="mb-8 overflow-x-auto rounded-lg border border-gray-200 bg-white p-4">
        <StageIndicator stages={stages} />
      </div>

      {/* Build timer */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3">
          <Timer className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-xs text-gray-600">Build Time</p>
            <p className="font-mono text-2xl font-bold text-indigo-600">
              {formatBuildTime(buildTime)}
            </p>
          </div>
          {buildStatus === 'complete' && buildTime < 180000 && (
            <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1">
              <Trophy className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-green-700">Under 3 min!</span>
            </div>
          )}
        </div>
      </div>

      {/* Status banners */}
      {buildStatus === 'complete' && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <span>
            Agent built and deployed successfully! Head to the{' '}
            <button
              onClick={() => navigate('/agents')}
              className="font-medium underline hover:text-green-900"
            >
              Agent Library
            </button>{' '}
            to manage it.
          </span>
          <button
            onClick={shareAgentCreation}
            className="ml-4 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <Share2 className="h-4 w-4" />
            Share Your Success
          </button>
        </div>
      )}
      {buildStatus === 'error' && (
        <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 p-6">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-red-600 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Build Failed</h3>
              <p className="text-sm text-red-700 mb-4">
                Something went wrong during the{' '}
                <span className="font-medium">{STAGES[currentStageIndex]?.label ?? 'build'}</span>{' '}
                stage.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-900">Try these fixes:</p>
                <ul className="space-y-1 text-sm text-red-700">
                  <li>• Check your Gemini API key is valid</li>
                  <li>• Simplify your agent description</li>
                  <li>• Try again in a few seconds</li>
                  <li>• Contact support if issue persists</li>
                </ul>
              </div>
              <button
                onClick={handleRetry}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
              >
                <RotateCcw className="h-4 w-4" />
                Retry Build
              </button>
            </div>
          </div>
        </div>
      )}
      {buildStatus === 'cancelled' && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          Build was cancelled. You can retry or go back to modify your description.
        </div>
      )}

      {/* Main content panels */}
      <div className="space-y-6">
        {rateLimitSeconds > 0 && isRunning && (
          <RateLimitGame secondsLeft={rateLimitSeconds} />
        )}

        <ThinkingStream
          tokens={thinkingTokens}
          isActive={isRunning && !isDeploying}
          actualThinkingTokens={totalThinkingTokens}
        />

        {(isGenerating || codeFiles.length > 0) && (
          <CodePreview
            files={codeFiles}
            testResults={testResults}
            isActive={isRunning && isGenerating}
          />
        )}

        {(isDeploying || deployLogs.length > 0) && (
          <DeploymentLog
            logs={deployLogs}
            isActive={isRunning && isDeploying}
          />
        )}
      </div>
    </div>
  )
}
