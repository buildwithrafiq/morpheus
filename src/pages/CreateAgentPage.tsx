import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Loader2, Eye, CheckCircle, Wand2 } from 'lucide-react'
import { detectCapabilities } from '@/services/capability-detector'
import type { AdvancedOptions, AgentSpec } from '@/types/agent'
import { validateDescription } from '@/services/description-validator'
import { useToast } from '@/components/Toast'
import { useServices } from '@/contexts/ServiceContext'
import AdvancedOptionsPanel from '@/components/create/AdvancedOptionsPanel'
import ComplexityEstimator from '@/components/create/ComplexityEstimator'
import ClarifyingQuestions, { type ClarifyingQuestion } from '@/components/create/ClarifyingQuestions'

const MAX_LENGTH = 10_000

export default function CreateAgentPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { gemini } = useServices()
  const [description, setDescription] = useState('')
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({})
  const [showClarifying, setShowClarifying] = useState(false)
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>([])
  const [, setClarifyingAnswers] = useState<Record<number, string>>({})
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)

  const capabilities = useMemo(() => detectCapabilities(description), [description])
  const validation = validateDescription(description)
  const validationMessage = description.length > 0 && !validation.valid ? validation.message : null
  const isValid = validation.valid
  const charCount = description.length

  const shouldShowClarifying = description.length >= 50 &&
    /\b(maybe|possibly|some kind of|not sure|or something)\b/i.test(description)

  const navigateToBuild = () => {
    const buildId = `build-${Date.now()}`
    navigate(`/build/${buildId}`, {
      state: { description, advancedOptions },
    })
  }

  const generateClarifyingQuestions = async (): Promise<ClarifyingQuestion[]> => {
    const stream = gemini.analyzeRequirements(description, advancedOptions)
    let spec: AgentSpec | null = null
    for await (const chunk of stream) {
      if (chunk.type === 'result' && chunk.content) {
        spec = chunk.content as AgentSpec
      }
    }
    if (!spec) return []

    const questions: ClarifyingQuestion[] = []
    for (const field of spec.inferredFields ?? []) {
      questions.push({
        question: `Could you clarify: ${field}?`,
        exampleAnswer: 'Provide more details about this aspect',
      })
    }
    for (const edge of spec.edgeCases ?? []) {
      questions.push({
        question: `How should the agent handle: ${edge.description}?`,
        exampleAnswer: edge.mitigation,
      })
    }
    return questions.slice(0, 5)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      addToast('error', validation.message ?? 'Invalid description')
      return
    }

    if (shouldShowClarifying && !showClarifying) {
      setIsGeneratingQuestions(true)
      try {
        const questions = await generateClarifyingQuestions()
        if (questions.length > 0) {
          setClarifyingQuestions(questions)
          setShowClarifying(true)
        } else {
          navigateToBuild()
        }
      } catch {
        navigateToBuild()
      } finally {
        setIsGeneratingQuestions(false)
      }
      return
    }

    navigateToBuild()
  }

  const handleClarifyingAnswer = (index: number, answer: string) => {
    setClarifyingAnswers(prev => ({ ...prev, [index]: answer }))
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
          <Wand2 className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create an AI Agent</h1>
        <p className="mt-2 text-sm text-gray-500">
          Describe what you need in plain language. Gemini 3 handles the rest.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="min-w-0 flex-1 space-y-5">
          <div>
            <label htmlFor="agent-description" className="block text-sm font-medium text-gray-700">
              What should your agent do?
            </label>
            <textarea
              id="agent-description"
              rows={7}
              value={description}
              onChange={e => {
                setDescription(e.target.value)
                setShowClarifying(false)
                setClarifyingQuestions([])
              }}
              placeholder="Example: 'Build me an AI that reads customer support emails, categorizes them by urgency, and drafts responses using our knowledge base. It should escalate VIP customers immediately.'"
              className={`mt-1.5 block w-full resize-y rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                validationMessage
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              maxLength={MAX_LENGTH}
              aria-describedby="char-counter validation-message"
            />
            <div className="mt-1.5 flex items-center justify-between">
              {validationMessage ? (
                <p id="validation-message" className="text-sm text-red-600" role="alert">
                  {validationMessage}
                </p>
              ) : (
                <span />
              )}
              <p
                id="char-counter"
                className={`text-xs ${charCount > MAX_LENGTH ? 'text-red-500' : 'text-gray-400'}`}
              >
                {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
              </p>
            </div>
          </div>

          <ComplexityEstimator description={description} />

          <AdvancedOptionsPanel options={advancedOptions} onChange={setAdvancedOptions} />

          {isGeneratingQuestions && (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              <p className="text-sm text-indigo-700">Generating clarifying questions...</p>
            </div>
          )}

          {showClarifying && !isGeneratingQuestions && (
            <ClarifyingQuestions
              questions={clarifyingQuestions}
              onAnswer={handleClarifyingAnswer}
              onProceedBasic={navigateToBuild}
            />
          )}

          <button
            type="submit"
            disabled={!isValid || isGeneratingQuestions}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            <Sparkles className="h-5 w-5" />
            {isGeneratingQuestions ? 'Generating Questions...' : showClarifying ? 'Build Agent with Answers' : 'Build My Agent'}
          </button>
        </form>

        {/* Right sidebar — live preview */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20 space-y-4">
            {description.length > 30 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Eye className="h-4 w-4 text-indigo-600" />
                  Agent Preview
                </h3>
                <div className="space-y-2.5">
                  {capabilities.map((cap) => (
                    <div key={cap.label} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                      <div className="text-xs">
                        <span className="mr-1" aria-hidden="true">{cap.icon}</span>
                        <span className="font-medium text-gray-700">{cap.label}</span>
                        <p className="mt-0.5 text-gray-400">{cap.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 text-center">
                <Eye className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-xs text-gray-400">
                  Start typing to see a live preview of detected capabilities
                </p>
              </div>
            )}

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-xs font-medium text-indigo-700">How it works</p>
              <ol className="mt-2 space-y-1.5 text-xs text-indigo-600">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span> Describe your agent
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span> Gemini 3 Pro analyzes requirements
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span> Architecture is designed
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span> Code, tests, and UI generated
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">5.</span> Deployed with API endpoint
                </li>
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
