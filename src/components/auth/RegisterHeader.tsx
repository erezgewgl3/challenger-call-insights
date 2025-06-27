
import { Brain } from 'lucide-react'

export function RegisterHeader() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <Brain className="h-7 w-7 text-white" />
        </div>
        <span className="text-2xl font-bold text-slate-900">Sales Whisperer</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Join Sales Whisperer</h1>
      <p className="text-slate-600">Create your account with an invite token</p>
    </div>
  )
}
