import { Link } from 'react-router-dom'
import { Bot, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <Bot className="h-16 w-16 text-gray-300" />
      <h1 className="mt-6 text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  )
}
