
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Clock, FileText, Brain, RotateCcw } from 'lucide-react'

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

interface UploadProgressProps {
  uploadStatus: UploadStatus
  analysisProgress: number
  error: string | null
  estimatedTime: string | null
  onRetry: () => void
  onUploadAnother: () => void
}

export function UploadProgress({ 
  uploadStatus, 
  analysisProgress, 
  error, 
  estimatedTime, 
  onRetry, 
  onUploadAnother 
}: UploadProgressProps) {
  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <FileText className="h-8 w-8 text-blue-500" />
      case 'processing':
        return <Brain className="h-8 w-8 text-purple-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading transcript...'
      case 'processing':
        return 'AI analysis in progress...'
      case 'completed':
        return 'Analysis completed! Redirecting to results...'
      case 'error':
        return 'Upload failed'
      default:
        return ''
    }
  }

  const getProgressColor = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'bg-blue-500'
      case 'processing':
        return 'bg-purple-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card className="shadow-md bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
          <div className="p-2 bg-blue-100 rounded-lg">
            {getStatusIcon()}
          </div>
          <span>Processing Your Transcript</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-medium text-slate-900">
              {getStatusMessage()}
            </p>
            {estimatedTime && uploadStatus === 'processing' && (
              <p className="text-sm text-slate-600">
                <Clock className="w-4 h-4 inline mr-1" />
                Estimated time: {estimatedTime}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={analysisProgress} 
              className={`h-3 ${getProgressColor()}`}
            />
            <p className="text-sm text-slate-500">
              {Math.round(analysisProgress)}% complete
            </p>
          </div>

          {/* Processing Steps */}
          {uploadStatus === 'processing' && (
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-slate-600">📄 Transcript uploaded and validated</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 flex items-center justify-center">
                  {analysisProgress > 50 ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> :
                    <Clock className="w-4 h-4 text-blue-500 animate-spin" />
                  }
                </div>
                <span className="text-slate-600">🧠 AI analyzing with Challenger methodology</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 flex items-center justify-center">
                  {analysisProgress > 80 ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> :
                    <Clock className="w-4 h-4 text-slate-400" />
                  }
                </div>
                <span className="text-slate-600">✉️ Generating follow-up recommendations</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {uploadStatus === 'error' && error && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium mb-2">Upload Failed</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <Button 
                onClick={onRetry}
                className="w-full"
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {/* Completed State */}
          {uploadStatus === 'completed' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">Analysis Complete!</p>
                </div>
                <p className="text-green-600 text-sm">
                  Your conversation insights are ready. You'll be redirected to the results page in a moment.
                </p>
              </div>
              <Button 
                onClick={onUploadAnother}
                variant="outline"
                className="w-full"
              >
                Upload Another Transcript
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
