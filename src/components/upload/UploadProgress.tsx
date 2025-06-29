
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, FileText, RotateCcw } from 'lucide-react'
import { AnalysisProgress } from '@/components/analysis/AnalysisProgress'

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

interface UploadProgressProps {
  uploadStatus: UploadStatus
  analysisProgress: number
  error: string | null
  estimatedTime: string | null
  onRetry: () => void
  onUploadAnother: () => void
  fileName?: string
  fileSize?: number
  fileDuration?: number
}

export function UploadProgress({ 
  uploadStatus, 
  analysisProgress, 
  error, 
  estimatedTime, 
  onRetry, 
  onUploadAnother,
  fileName,
  fileSize,
  fileDuration
}: UploadProgressProps) {
  
  // Determine analysis strategy based on duration
  const getAnalysisStrategy = (): 'single_pass' | 'smart_chunking' | 'hierarchical' => {
    if (!fileDuration) return 'single_pass'
    if (fileDuration <= 30) return 'single_pass'
    if (fileDuration <= 90) return 'smart_chunking'
    return 'hierarchical'
  }

  // Show AnalysisProgress for processing state
  if (uploadStatus === 'processing') {
    return (
      <AnalysisProgress
        progress={analysisProgress}
        strategy={getAnalysisStrategy()}
        estimatedTime={estimatedTime}
        fileName={fileName}
        fileSize={fileSize}
        fileDuration={fileDuration}
        onCancel={onRetry}
      />
    )
  }

  // Show upload progress for uploading state
  if (uploadStatus === 'uploading') {
    return (
      <Card className="shadow-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <span>Uploading Your Transcript</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-lg font-medium text-slate-900">
                Preparing your file for analysis...
              </p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(analysisProgress, 20)}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">
              {Math.round(Math.min(analysisProgress, 20))}% complete
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show completion state
  if (uploadStatus === 'completed') {
    return (
      <Card className="shadow-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <span>Analysis Complete!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
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
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (uploadStatus === 'error') {
    return (
      <Card className="shadow-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <span>Upload Failed</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
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
        </CardContent>
      </Card>
    )
  }

  return null
}
