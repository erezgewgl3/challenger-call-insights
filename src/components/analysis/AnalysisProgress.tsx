
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
          icon: <Zap className="w-6 h-6 text-blue-500" />,
          title: 'Quick Analysis',
          description: 'Lightning-fast insights extraction',
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case 'smart_chunking':
        return {
          icon: <Target className="w-6 h-6 text-purple-500" />,
          title: 'Smart Analysis',
          description: 'Intelligent conversation breakdown',
          color: 'purple',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        }
      case 'hierarchical':
        return {
          icon: <Brain className="w-6 h-6 text-indigo-500" />,
          title: 'Deep Analysis',
          description: 'Comprehensive insight discovery',
          color: 'indigo',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200'
        }
    }
  }

  const getCurrentPhase = () => {
    if (progress <= 20) return { text: 'Uploading transcript...', detail: 'Processing your file' }
    if (progress <= 30) return { text: 'Analyzing conversation...', detail: 'Preparing for AI analysis' }
    if (progress <= 90) return { text: 'Discovering insights...', detail: 'AI is reading your conversation' }
    return { text: 'Preparing results...', detail: 'Almost ready!' }
  }

  const strategyInfo = getStrategyInfo()
  const currentPhase = getCurrentPhase()
  const circumference = 2 * Math.PI * 54 // radius of 54

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card className={`shadow-lg ${strategyInfo.bgColor} ${strategyInfo.borderColor} border-2 animate-fade-in`}>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
            <div className={`p-2 ${strategyInfo.bgColor} rounded-lg border ${strategyInfo.borderColor}`}>
              {strategyInfo.icon}
            </div>
            <div className="text-left">
              <div>{strategyInfo.title}</div>
              <div className="text-sm text-slate-600 font-normal">{strategyInfo.description}</div>
            </div>
          </CardTitle>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Ring */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-200"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (displayProgress / 100) * circumference}
                className={`text-${strategyInfo.color}-500 transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-2xl font-bold text-${strategyInfo.color}-600`}>
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

        {/* Current Phase */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">{currentPhase.text}</h3>
          <p className="text-sm text-slate-600">{currentPhase.detail}</p>
          {estimatedTime && (
            <div className="flex items-center justify-center space-x-1 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>Estimated time: {estimatedTime}</span>
            </div>
          )}
        </div>

        {/* File Information */}
        {fileName && (
          <div className={`p-4 ${strategyInfo.bgColor} rounded-lg border ${strategyInfo.borderColor}`}>
            <div className="flex items-start space-x-3">
              <FileText className={`w-5 h-5 text-${strategyInfo.color}-500 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{fileName}</p>
                <div className="flex items-center space-x-4 mt-1 text-xs text-slate-600">
                  {fileSize && <span>{formatFileSize(fileSize)}</span>}
                  {fileDuration && <span>{fileDuration} minutes</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${progress > 20 ? `bg-${strategyInfo.color}-500` : 'bg-slate-300'} transition-colors duration-300`} />
            <span className={`text-sm ${progress > 20 ? 'text-slate-900' : 'text-slate-500'}`}>
              File uploaded and validated
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${progress > 50 ? `bg-${strategyInfo.color}-500` : 'bg-slate-300'} transition-colors duration-300`} />
            <span className={`text-sm ${progress > 50 ? 'text-slate-900' : 'text-slate-500'}`}>
              AI analyzing with Challenger methodology
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${progress > 90 ? `bg-${strategyInfo.color}-500` : 'bg-slate-300'} transition-colors duration-300`} />
            <span className={`text-sm ${progress > 90 ? 'text-slate-900' : 'text-slate-500'}`}>
              Generating coaching recommendations
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
