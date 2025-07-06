
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, FileText, RotateCcw } from 'lucide-react'
import { AnalysisProgress } from '@/components/analysis/AnalysisProgress'

type UploadStatus = 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error'

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

  // Show validation progress for validating state
  if (uploadStatus === 'validating') {
    return (
      <Card className="shadow-md bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 text-sm">Validating Your File</p>
              <p className="text-xs text-slate-600">Checking format and extracting content...</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(analysisProgress, 40)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 text-center">
            {Math.round(Math.min(analysisProgress, 40))}% complete
          </p>
        </CardContent>
      </Card>
    )
  }

  // Show upload progress for uploading state
  if (uploadStatus === 'uploading') {
    return (
      <Card className="shadow-md bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 text-sm">Uploading Your Transcript</p>
              <p className="text-xs text-slate-600">Preparing for analysis...</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(analysisProgress, 80)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 text-center">
            {Math.round(Math.min(analysisProgress, 80))}% complete
          </p>
        </CardContent>
      </Card>
    )
  }

  // Show completion state
  if (uploadStatus === 'completed') {
    return (
      <Card className="shadow-md bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 text-sm">Analysis Complete!</p>
              <p className="text-xs text-slate-600">Redirecting to results...</p>
            </div>
          </div>

          <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-green-800 font-medium text-xs">Your insights are ready!</p>
            </div>
          </div>
          
          <Button 
            onClick={onUploadAnother}
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
          >
            Upload Another Transcript
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (uploadStatus === 'error') {
    return (
      <Card className="shadow-md bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 text-sm">Upload Failed</p>
              <p className="text-xs text-slate-600">Please try again</p>
            </div>
          </div>

          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium text-xs mb-1">Upload Failed</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
          
          <Button 
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
