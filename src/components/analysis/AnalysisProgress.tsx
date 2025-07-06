
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
  const [analysisStartTime, setAnalysisStartTime] = useState<number>(Date.now())

  // Initialize analysis start time
  useEffect(() => {
    if (progress > 0) {
      setAnalysisStartTime(Date.now())
    }
  }, [])

  // Enhanced progress mapping with realistic phases
  const getEnhancedProgress = (rawProgress: number) => {
    if (rawProgress <= 25) {
      // File upload phase: 0-15%
      return Math.min(15, rawProgress * 0.6)
    } else if (rawProgress <= 40) {
      // Initial processing: 15-30%
      return 15 + ((rawProgress - 25) / 15) * 15
    } else if (rawProgress <= 60) {
      // AI analysis start: 30-50%
      return 30 + ((rawProgress - 40) / 20) * 20
    } else if (rawProgress <= 90) {
      // Deep analysis: 50-85%
      return 50 + ((rawProgress - 60) / 30) * 35
    } else {
      // Finalizing results: 85-100%
      return 85 + ((rawProgress - 90) / 10) * 15
    }
  }

  // Smooth progress animation with enhanced mapping
  useEffect(() => {
    const enhancedProgress = getEnhancedProgress(progress)
    const timer = setTimeout(() => {
      setDisplayProgress(enhancedProgress)
    }, 100)
    return () => clearTimeout(timer)
  }, [progress])

  // Real-time countdown timer
  useEffect(() => {
    if (!estimatedTime) return

    // Extract seconds from estimated time string
    const getSecondsFromEstimate = (estimate: string) => {
      if (estimate.includes('8')) return 8
      if (estimate.includes('25')) return 25
      if (estimate.includes('60')) return 60
      return 30 // default fallback
    }

    const totalSeconds = getSecondsFromEstimate(estimatedTime)
    const elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000)
    const remaining = Math.max(0, totalSeconds - elapsedSeconds)
    
    setTimeRemaining(remaining)

    if (remaining > 0 && progress < 100) {
      const interval = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - analysisStartTime) / 1000)
        const currentRemaining = Math.max(0, totalSeconds - currentElapsed)
        setTimeRemaining(currentRemaining)
        
        if (currentRemaining === 0) {
          clearInterval(interval)
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [estimatedTime, analysisStartTime, progress])

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
    if (displayProgress <= 15) return 'Uploading transcript...'
    if (displayProgress <= 30) return 'Processing file...'
    if (displayProgress <= 50) return 'Starting AI analysis...'
    if (displayProgress <= 85) return 'Analyzing conversation...'
    return 'Finalizing insights...'
  }

  const strategyInfo = getStrategyInfo()
  const currentPhase = getCurrentPhase()
  const circumference = 2 * Math.PI * 36

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getProgressSteps = () => {
    return [
      { completed: displayProgress > 15, text: 'File uploaded' },
      { completed: displayProgress > 50, text: 'AI analyzing' },
      { completed: displayProgress > 85, text: 'Generating results' }
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
        <div className="flex items-center space-x-6">
          {/* Enhanced Progress Ring */}
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-slate-200"
                />
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
                  {timeRemaining > 0 && progress < 100 && (
                    <div className="text-xs text-slate-500">
                      {timeRemaining}s left
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Information Display */}
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
                    {fileDuration && (
                      <span className="flex items-center space-x-1">
                        <span>•</span>
                        <span className="font-medium">Meeting length: {fileDuration} min</span>
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Progress Steps */}
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

            {/* Time Estimation */}
            {estimatedTime && (
              <div className="flex items-center space-x-1 text-sm text-slate-500">
                <Clock className="w-3 h-3" />
                <span>
                  Estimated total: {estimatedTime}
                  {timeRemaining > 0 && progress < 100 && (
                    <span className="ml-2 font-medium text-slate-700">
                      ({timeRemaining}s remaining)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
