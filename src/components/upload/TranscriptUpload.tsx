
import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadProgress } from './UploadProgress'
import { useTranscriptUpload } from '@/hooks/useTranscriptUpload'
import { Upload, FileText, Zap, Brain, Target, MessageSquare, ArrowRight } from 'lucide-react'

interface TranscriptUploadProps {
  onAnalysisComplete?: (transcriptId: string) => void
}

export function TranscriptUpload({ onAnalysisComplete }: TranscriptUploadProps) {
  const { uploadFiles, processFiles, removeFile, retryFile, clearFiles, isUploading } = useTranscriptUpload(onAnalysisComplete)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    processFiles(acceptedFiles)
  }, [processFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/vtt': ['.vtt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const handleClearAll = () => {
    clearFiles()
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
      <CardContent className="space-y-3 p-4">
        {/* Compact Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            
            {isDragActive ? (
              <div>
                <p className="font-medium text-blue-600 text-sm">Drop files here...</p>
                <p className="text-xs text-gray-600">Release to upload your transcripts</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Drag & drop transcripts or <span className="text-blue-600">browse files</span>
                </p>
                <p className="text-xs text-gray-500">
                  Supports .txt, .docx, and .vtt files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Upload Progress</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll}
                disabled={isUploading}
                className="h-6 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2">
              {uploadFiles.map((file) => (
                <UploadProgress
                  key={file.id}
                  uploadStatus={file.status}
                  analysisProgress={file.progress}
                  error={file.error || null}
                  estimatedTime={file.metadata?.durationMinutes ? 
                    (file.metadata.durationMinutes <= 30 ? '8 seconds' : 
                     file.metadata.durationMinutes <= 90 ? '20 seconds' : '45 seconds') : 
                    '8 seconds'
                  }
                  onRetry={() => retryFile(file.id)}
                  onUploadAnother={handleClearAll}
                  fileName={file.file.name}
                  fileSize={file.file.size}
                  fileDuration={file.metadata?.durationMinutes}
                />
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Professional Features Section */}
        <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 p-3 rounded-lg border border-emerald-100/50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900">What You'll Get</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="group flex items-center space-x-2 p-1.5 rounded-md hover:bg-white/60 transition-all duration-200 cursor-default">
              <div className="p-1 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors">
                <Brain className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700 transition-colors">Client intelligence</span>
            </div>
            <div className="group flex items-center space-x-2 p-1.5 rounded-md hover:bg-white/60 transition-all duration-200 cursor-default">
              <div className="p-1 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <Target className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Strategic insights</span>
            </div>
            <div className="group flex items-center space-x-2 p-1.5 rounded-md hover:bg-white/60 transition-all duration-200 cursor-default">
              <div className="p-1 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                <MessageSquare className="w-3 h-3 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-purple-700 transition-colors">Follow-up content</span>
            </div>
            <div className="group flex items-center space-x-2 p-1.5 rounded-md hover:bg-white/60 transition-all duration-200 cursor-default">
              <div className="p-1 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                <ArrowRight className="w-3 h-3 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-orange-700 transition-colors">Next steps</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
