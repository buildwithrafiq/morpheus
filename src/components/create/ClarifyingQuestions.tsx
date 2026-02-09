import { HelpCircle } from 'lucide-react'

export interface ClarifyingQuestion {
  question: string
  exampleAnswer: string
}

interface ClarifyingQuestionsProps {
  questions: ClarifyingQuestion[]
  onAnswer: (index: number, answer: string) => void
  onProceedBasic: () => void
}

export default function ClarifyingQuestions({ questions, onAnswer, onProceedBasic }: ClarifyingQuestionsProps) {
  if (questions.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-800">
          A few clarifying questions
        </h3>
      </div>
      <p className="mt-1 text-xs text-amber-700">
        Your description has some ambiguous parts. Answer below or proceed with a basic version.
      </p>

      <div className="mt-3 space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="rounded-md bg-white p-3 shadow-sm">
            <p className="text-sm font-medium text-gray-800">{q.question}</p>
            <p className="mt-1 text-xs text-gray-400">Example: {q.exampleAnswer}</p>
            <input
              type="text"
              placeholder="Your answer (optional)"
              onChange={e => onAnswer(i, e.target.value)}
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label={`Answer for: ${q.question}`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onProceedBasic}
        className="mt-3 text-sm font-medium text-amber-700 underline hover:text-amber-900"
      >
        Skip — proceed with basic version
      </button>
    </div>
  )
}
