
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, FileText, Clock, Zap, Target, X, CheckCircle, Loader } from 'lucide-react'

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
          icon: <Zap className="w-4 h-4 text-blue-500" />,
          title: 'Quick Analysis',
          description: 'Lightning-fast insights',
          color: 'blue'
        }
      case 'smart_chunking':
        return {
          icon: <Target className="w-4 h-4 text-purple-500" />,
          title: 'Smart Analysis',
          description: 'Intelligent breakdown',
          color: 'purple'
        }
      case 'hierarchical':
        return {
          icon: <Brain className="w-4 h-4 text-indigo-500" />,
          title: 'Deep Analysis',
          description: 'Comprehensive insights',
          color: 'indigo'
        }
    }
  }

  // Smart time estimation based on file characteristics
  const getTimeEstimate = () => {
    if (fileDuration) {
      if (fileDuration <= 30) return '30-60 seconds'
      if (fileDuration <= 60) return '45-90 seconds'
      if (fileDuration <= 90) return '60-120 seconds'
      return '90-180 seconds'
    }
    
    if (fileSize) {
      if (fileSize < 50000) return '30-60 seconds' // < 50KB
      if (fileSize < 200000) return '45-90 seconds' // < 200KB
      return '60-120 seconds'
    }
    
    return '30-90 seconds'
  }

  // Define analysis stages
  const getAnalysisStages = () => {
    const stages = [
      { id: 'processing', label: 'Processing transcript', threshold: 33 },
      { id: 'analyzing', label: 'AI analyzing conversation', threshold: 66 },
      { id: 'generating', label: 'Generating insights', threshold: 90 },
      { id: 'complete', label: 'Analysis complete', threshold: 100 }
    ]

    return stages.map(stage => ({
      ...stage,
      isCompleted: progress >= stage.threshold,
      isActive: progress >= (stage.threshold - 33) && progress < stage.threshold,
      isCurrent: progress < stage.threshold && progress >= Math.max(0, stage.threshold - 33)
    }))
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const strategyInfo = getStrategyInfo()
  const stages = getAnalysisStages()
  const currentStage = stages.find(stage => stage.isCurrent) || stages[0]

  return (
    <Card className="shadow-md bg-white animate-fade-in">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg text-slate-900">
            <div className="p-1 bg-blue-50 rounded-lg border border-blue-200">
              {strategyInfo.icon}
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">{strategyInfo.title}</span>
              <span className="text-sm text-slate-600 font-normal">• {strategyInfo.description}</span>
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

      <CardContent className="p-4 pt-0">
        <div className="flex items-center space-x-3">
          {/* Animated Spinner */}
          <div className="flex-shrink-0">
            <div className="relative w-12 h-12 flex items-center justify-center">
              {progress >= 100 ? (
                <div className={`w-10 h-10 rounded-full bg-${strategyInfo.color}-100 flex items-center justify-center`}>
                  <CheckCircle className={`w-5 h-5 text-${strategyInfo.color}-600`} />
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full bg-${strategyInfo.color}-100 flex items-center justify-center`}>
                  <Loader className={`w-5 h-5 text-${strategyInfo.color}-600 animate-spin`} />
                </div>
              )}
            </div>
          </div>

          {/* Information Display */}
          <div className="flex-1 space-y-2">
            {/* Current Status with File Info */}
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {message || currentStage.label}
              </h3>
              {fileName && (
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-32">{fileName}</span>
                  {fileSize && <span>{formatFileSize(fileSize)}</span>}
                  {fileDuration && <span>{fileDuration} min meeting</span>}
                </div>
              )}
            </div>

            {/* Stage Progress with Time Estimation */}
            <div className="space-y-1">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center space-x-2">
                  {/* Stage Indicator */}
                  <div className="flex items-center justify-center w-3 h-3">
                    {stage.isCompleted ? (
                      <CheckCircle className={`w-3 h-3 text-${strategyInfo.color}-600`} />
                    ) : stage.isCurrent ? (
                      <div className={`w-1 h-1 rounded-full bg-${strategyInfo.color}-500 animate-pulse`} />
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                    )}
                  </div>
                  
                  {/* Stage Label */}
                  <span className={`text-xs ${
                    stage.isCompleted || stage.isCurrent 
                      ? 'text-slate-900 font-medium' 
                      : 'text-slate-500'
                  }`}>
                    {stage.label}
                  </span>
                </div>
              ))}
              
              {/* Time Estimation integrated */}
              <div className="flex items-center space-x-2 text-xs text-slate-500 pl-5">
                <Clock className="w-3 h-3" />
                <span>Expected: {getTimeEstimate()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
