
import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <span>Upload Sales Call</span>
        </CardTitle>
        <CardDescription className="text-slate-600">
          Upload your sales call transcript to get AI-powered intelligence and actionable recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium text-blue-600">Drop files here...</p>
                <p className="text-sm text-gray-600">Release to upload your sales call transcripts</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drag & drop your sales call transcripts
                </p>
                <p className="text-sm text-gray-600">
                  or <span className="text-blue-600 font-medium">browse files</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports .txt, .docx, and .vtt files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Upload Progress</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-3">
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

        {/* Features */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-gray-900">What You'll Get</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Client intelligence & buying signals</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Strategic recommendations</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>Copy-paste follow-up content</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span>Actionable next steps</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
