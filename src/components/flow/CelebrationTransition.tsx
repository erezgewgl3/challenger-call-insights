
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Sparkles, TrendingUp } from 'lucide-react'

interface CelebrationTransitionProps {
  fileName?: string
}

export function CelebrationTransition({ fileName }: CelebrationTransitionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
      <Card className="max-w-md mx-auto shadow-xl border-green-200 animate-scale-in">
        <CardContent className="p-8 text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-yellow-500 animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Analysis Complete!</h2>
            <p className="text-slate-600">
              Your conversation insights are ready{fileName && ` for "${fileName}"`}
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Preparing your coaching insights...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
