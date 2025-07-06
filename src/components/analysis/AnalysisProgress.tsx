
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, FileText, Clock, Zap, Target, X } from 'lucide-react'

interface AnalysisProgressProps {
  progress: number
  strategy: 'single_pass' | 'smart_chunking' | 'hierarchical'
  fileName?: string
  fileSize?: number
  fileDuration?: number
  onCancel?: () => void
  phase?: string
  message?: string
}

export function AnalysisProgress({
  progress,
  strategy,
  fileName,
  fileSize,
  fileDuration,
  onCancel,
  message
}: AnalysisProgressProps) {

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

  // Use simple 3-state progress only: 33%, 66%, or 100%
  const getDisplayProgress = () => {
    if (progress >= 100) return 100
    if (progress >= 66) return 66
    if (progress >= 33) return 33
    return 0
  }

  // Simple status message based on progress
  const getStatusMessage = () => {
    if (message) return message
    
    const displayProgress = getDisplayProgress()
    if (displayProgress >= 100) return 'Analysis complete!'
    if (displayProgress >= 66) return 'AI analyzing conversation...'
    if (displayProgress >= 33) return 'Processing transcript...'
    return 'Starting analysis...'
  }

  // Simple progress steps
  const getProgressSteps = () => {
    const displayProgress = getDisplayProgress()
    return [
      { completed: displayProgress >= 33, text: 'Processing' },
      { completed: displayProgress >= 66, text: 'Analyzing' },
      { completed: displayProgress >= 100, text: 'Complete' }
    ]
  }

  const strategyInfo = getStrategyInfo()
  const displayProgress = getDisplayProgress()
  const circumference = 2 * Math.PI * 36

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Static time estimate based on file duration
  const getTimeEstimate = () => {
    if (!fileDuration) return 'Usually takes 30-90 seconds'
    if (fileDuration <= 30) return 'Usually takes 30-60 seconds'
    if (fileDuration <= 90) return 'Usually takes 60-120 seconds'
    return 'Usually takes 90-180 seconds'
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
          {/* Progress Ring - Only shows 0, 33, 66, or 100% */}
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
                    {displayProgress}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Display */}
          <div className="flex-1 space-y-3">
            {/* Current Status */}
            <div>
              <h3 className="text-base font-semibold text-slate-900">{getStatusMessage()}</h3>
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
                        <span className="font-medium">{fileDuration} min meeting</span>
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

            {/* Static Time Estimation */}
            <div className="flex items-center space-x-1 text-sm text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{getTimeEstimate()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
