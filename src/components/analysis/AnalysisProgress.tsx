
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, FileText, Clock, Zap, Target, X } from 'lucide-react'

interface AnalysisProgressProps {
  progress: number
  strategy: 'single_pass' | 'smart_chunking' | 'hierarchical'
  estimatedTime: string | null
  fileName?: string
  fileSize?: number
  fileDuration?: number
  onCancel?: () => void
}

export function AnalysisProgress({
  progress,
  strategy,
  estimatedTime,
  fileName,
  fileSize,
  fileDuration,
  onCancel
}: AnalysisProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress)
    }, 100)
    return () => clearTimeout(timer)
  }, [progress])

  // Countdown timer effect
  useEffect(() => {
    if (!estimatedTime) return

    const totalSeconds = estimatedTime.includes('8') ? 8 : 
                        estimatedTime.includes('25') ? 25 : 60
    
    const remaining = Math.max(0, totalSeconds - (progress / 100) * totalSeconds)
    setTimeRemaining(Math.ceil(remaining))

    if (remaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [estimatedTime, progress])

  const getStrategyInfo = () => {
    switch (strategy) {
      case 'single_pass':
        return {
          icon: <Zap className="w-5 h-5 text-blue-500" />,
          title: 'Quick Analysis',
          description: 'Lightning-fast insights',
          color: 'blue'
        }
      case 'smart_chunking':
        return {
          icon: <Target className="w-5 h-5 text-purple-500" />,
          title: 'Smart Analysis',
          description: 'Intelligent breakdown',
          color: 'purple'
        }
      case 'hierarchical':
        return {
          icon: <Brain className="w-5 h-5 text-indigo-500" />,
          title: 'Deep Analysis',
          description: 'Comprehensive insights',
          color: 'indigo'
        }
    }
  }

  const getCurrentPhase = () => {
    if (progress <= 20) return 'Uploading transcript...'
    if (progress <= 30) return 'Analyzing conversation...'
    if (progress <= 90) return 'Discovering insights...'
    return 'Preparing results...'
  }

  const strategyInfo = getStrategyInfo()
  const currentPhase = getCurrentPhase()
  const circumference = 2 * Math.PI * 36 // radius of 36 for smaller ring

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getProgressSteps = () => {
    return [
      { completed: progress > 20, text: 'File uploaded' },
      { completed: progress > 50, text: 'AI analyzing' },
      { completed: progress > 90, text: 'Generating results' }
    ]
  }

  return (
    <Card className="shadow-md bg-white animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg text-slate-900">
            <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-200">
              {strategyInfo.icon}
            </div>
            <div>
              <div className="font-semibold">{strategyInfo.title}</div>
              <div className="text-sm text-slate-600 font-normal">{strategyInfo.description}</div>
            </div>
          </CardTitle>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Horizontal Layout */}
        <div className="flex items-center space-x-6">
          {/* Compact Progress Ring */}
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-slate-200"
                />
                {/* Progress circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (displayProgress / 100) * circumference}
                  className={`text-${strategyInfo.color}-500 transition-all duration-1000 ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-lg font-bold text-${strategyInfo.color}-600`}>
                    {Math.round(displayProgress)}%
                  </div>
                  {timeRemaining > 0 && (
                    <div className="text-xs text-slate-500">
                      {timeRemaining}s
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Consolidated Information */}
          <div className="flex-1 space-y-3">
            {/* Current Phase */}
            <div>
              <h3 className="text-base font-semibold text-slate-900">{currentPhase}</h3>
              <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                {fileName && (
                  <>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span className="truncate max-w-32">{fileName}</span>
                    </div>
                    {fileSize && <span>• {formatFileSize(fileSize)}</span>}
                    {fileDuration && <span>• {fileDuration} min</span>}
                  </>
                )}
              </div>
            </div>

            {/* Inline Progress Steps */}
            <div className="flex items-center space-x-4">
              {getProgressSteps().map((step, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <div 
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                      step.completed ? `bg-${strategyInfo.color}-500` : 'bg-slate-300'
                    }`} 
                  />
                  <span className={`text-xs ${step.completed ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Estimated Time */}
            {estimatedTime && (
              <div className="flex items-center space-x-1 text-sm text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Estimated: {estimatedTime}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
