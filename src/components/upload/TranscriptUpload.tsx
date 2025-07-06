
import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadProgress } from './UploadProgress'
import { useTranscriptUpload } from '@/hooks/useTranscriptUpload'
import { Upload, FileText, Zap } from 'lucide-react'

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
      <CardContent className="space-y-4 p-4">
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
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            
            {isDragActive ? (
              <div>
                <p className="font-medium text-blue-600">Drop files here...</p>
                <p className="text-xs text-gray-600">Release to upload your transcripts</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-900">
                  Drag & drop transcripts or <span className="text-blue-600">browse files</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports .txt, .docx, and .vtt files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Upload Progress</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll}
                disabled={isUploading}
                className="h-7 px-2 text-xs"
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

        {/* Compact Features Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-4 w-4 text-green-600" />
            <h4 className="text-sm font-medium text-gray-900">What You'll Get</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-700">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>Client intelligence</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Strategic insights</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              <span>Follow-up content</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              <span>Next steps</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
