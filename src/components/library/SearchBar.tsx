import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  debounceMs?: number
}

export default function SearchBar({ value, onChange, debounceMs = 250 }: SearchBarProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [local, debounceMs, onChange, value])

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        placeholder="Search agents by name, description, or tags…"
        value={local}
        onChange={e => setLocal(e.target.value)}
        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Search agents"
      />
    </div>
  )
}
