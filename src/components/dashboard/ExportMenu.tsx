import { useState } from 'react'
import { Download, Archive, Container, Code, ChevronDown } from 'lucide-react'

interface ExportMenuProps {
  agentName: string
}

const exportOptions = [
  { key: 'zip', label: 'Source Code (ZIP)', icon: Archive, description: 'Download all source files as a zip archive' },
  { key: 'docker', label: 'Docker Image', icon: Container, description: 'Download the Docker image for self-hosting' },
  { key: 'client', label: 'API Client', icon: Code, description: 'Download generated API client libraries' },
] as const

export default function ExportMenu({ agentName }: ExportMenuProps) {
  const [open, setOpen] = useState(false)

  const handleExport = (type: string) => {
    // Mock: in production this would trigger a real download
    alert(`Exporting ${agentName} as ${type}...`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Export agent"
      >
        <Download className="h-4 w-4" />
        Export
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-gray-200 bg-white py-1 shadow-lg" role="menu">
            {exportOptions.map(opt => (
              <button
                key={opt.key}
                type="button"
                role="menuitem"
                onClick={() => handleExport(opt.key)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <opt.icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
