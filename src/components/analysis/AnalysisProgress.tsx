
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, FileText, Clock, Zap, Target, X, CheckCircle, Loader, ExternalLink, ArrowRight, XCircle } from 'lucide-react'
import { ZohoContextCard } from '../transcript-queue/ZohoContextCard'

interface AnalysisProgressProps {
  progress: number
  strategy: 'single_pass' | 'smart_chunking' | 'hierarchical'
  fileName?: string
  fileSize?: number
  fileDuration?: number
  onCancel?: () => void
  phase?: string
  message?: string
  dealContext?: {
    company_name?: string
    contact_name?: string
    deal_name?: string
  }
  zohoDealId?: string | null
  isAssignedTranscript?: boolean
  onComplete?: () => void
}

export function AnalysisProgress({
  progress,
  strategy,
  fileName,
  fileSize,
  fileDuration,
  onCancel,
  message,
  dealContext,
  zohoDealId,
  isAssignedTranscript = false,
  onComplete
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

  // Define analysis stages with CRM integration
  const getAnalysisStages = () => {
    const baseStages = [
      { id: 'parsing', label: 'Parsing Transcript', threshold: 10 },
      { id: 'analysis', label: 'AI Analysis', threshold: 40 },
      { id: 'insights', label: 'Generating Insights', threshold: 70 },
      { id: 'formatting', label: 'Formatting Results', threshold: 90 }
    ]

    // Add CRM preparation step if dealing with external transcript
    if (dealContext || zohoDealId) {
      baseStages.push(
        { id: 'crm_prep', label: 'Preparing CRM Updates', threshold: 95 },
        { id: 'complete', label: 'Processing Complete', threshold: 100 }
      )
    } else {
      baseStages.push({ id: 'complete', label: 'Analysis Complete', threshold: 100 })
    }

    return baseStages.map(stage => ({
      ...stage,
      isCompleted: progress >= stage.threshold,
      isActive: progress >= (stage.threshold - 10) && progress < stage.threshold,
      isCurrent: progress < stage.threshold && progress >= Math.max(0, stage.threshold - 10)
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
    <div className="space-y-6">
      {/* Zoho Context Display */}
      {(dealContext || zohoDealId) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="outline">Zoho CRM Integration</Badge>
              {isAssignedTranscript && (
                <Badge variant="default">Assigned Transcript</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ZohoContextCard
              dealContext={dealContext || {}}
              zohoDealId={zohoDealId}
            />
            
            {progress >= 100 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Ready to update Zoho CRM
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Send to CRM
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing Steps */}
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
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Current Step */}
            {currentStage && progress < 100 && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Loader className="h-4 w-4 animate-spin" />
                <span className="font-medium">{message || currentStage.label}</span>
              </div>
            )}

            {/* Step List */}
            <div className="space-y-2">
              {stages.map((stage, index) => {
                const isCompleted = progress >= stage.threshold
                const isCurrent = progress >= Math.max(0, stage.threshold - 10) && progress < stage.threshold

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                      isCurrent ? 'bg-primary/10 border border-primary/20' :
                      isCompleted ? 'bg-green-50 border border-green-200' :
                      'bg-muted/30'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-600 text-white' :
                      isCurrent ? 'bg-primary text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : isCurrent ? (
                        <Loader className="h-3 w-3 animate-spin" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </div>
                    
                    <span className={`flex-1 ${
                      isCurrent ? 'font-medium' : 
                      isCompleted ? 'text-green-800' :
                      'text-muted-foreground'
                    }`}>
                      {stage.label}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {stage.threshold}%
                    </span>
                  </div>
                )
              })}

              {/* Time Estimation */}
              <div className="flex items-center space-x-2 text-xs text-slate-500 pl-5">
                <Clock className="w-3 h-3" />
                <span>Expected: {getTimeEstimate()}</span>
              </div>
            </div>

            {/* Completion Actions */}
            {progress >= 100 && onComplete && (
              <div className="pt-4 border-t">
                <Button onClick={onComplete} className="w-full">
                  View Analysis Results
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
