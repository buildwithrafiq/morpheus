import { useState, useEffect, useRef } from 'react'
import { FileCode, CheckCircle, XCircle } from 'lucide-react'
import type { GeneratedFile, TestResult } from '@/types/agent'

interface CodePreviewProps {
  files: GeneratedFile[]
  testResults: TestResult[]
  isActive: boolean
}

export default function CodePreview({ files, testResults, isActive }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState(0)
  const codeEndRef = useRef<HTMLDivElement>(null)
  const activeFile = files[activeTab]

  useEffect(() => {
    if (isActive && typeof codeEndRef.current?.scrollIntoView === 'function') {
      codeEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeFile?.content, isActive])

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Code Preview</span>
          {isActive && (
            <span className="flex items-center gap-1 text-xs text-indigo-500">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
              Generating
            </span>
          )}
        </div>
        {testResults.length > 0 && (
          <div className="flex items-center gap-2">
            {testResults.map((t, i) => (
              <span
                key={i}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  t.passed
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {t.passed ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* File tabs */}
      {files.length > 0 && (
        <div className="flex gap-0 border-b border-gray-200 bg-gray-50">
          {files.map((f, i) => (
            <button
              key={f.path}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                i === activeTab
                  ? 'border-b-2 border-indigo-500 bg-white text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.path.split('/').pop()}
            </button>
          ))}
        </div>
      )}

      {/* Code content */}
      <div className="max-h-96 overflow-auto bg-gray-950 p-4">
        {activeFile ? (
          <pre className="font-mono text-xs leading-relaxed text-gray-300">
            <code>{activeFile.content}</code>
            <div ref={codeEndRef} />
          </pre>
        ) : (
          <p className="font-mono text-xs text-gray-500 italic">
            Waiting for code generation...
          </p>
        )}
      </div>
    </div>
  )
}
