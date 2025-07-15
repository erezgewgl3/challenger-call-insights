
import { Brain } from 'lucide-react'

export function LoginHeader() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <div className="text-left">
          <span className="text-2xl font-bold text-slate-900 block">Sales Whisperer</span>
          <span className="text-sm text-blue-600 font-medium">Professional Edition</span>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3 leading-tight">
        Welcome to Your Sales Intelligence
        <span className="text-blue-600"> Command Center</span>
      </h1>
      <p className="text-slate-600 text-lg">
        Transform every conversation into closed deals with AI-powered coaching
      </p>
    </div>
  )
}
