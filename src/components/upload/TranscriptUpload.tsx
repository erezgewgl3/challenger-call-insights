
import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, CheckCircle, Clock, RotateCcw } from 'lucide-react'
import { useTranscriptUpload } from '@/hooks/useTranscriptUpload'

export function TranscriptUpload() {
  const { uploadFiles, processFiles, removeFile, retryFile, isUploading } = useTranscriptUpload()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      console.warn(`${rejection.file.name}: ${rejection.errors[0]?.message}`)
    })

    // Process accepted files
    if (acceptedFiles.length > 0) {
      processFiles(acceptedFiles)
    }
  }, [processFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/vtt': ['.vtt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    disabled: isUploading
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validating':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Validating</Badge>
      case 'uploading':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Uploading</Badge>
      case 'processing':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Analyzing</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validating':
      case 'uploading':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'processing':
        return <Clock className="h-5 w-5 text-purple-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-slate-500" />
    }
  }

  const getEstimatedTime = (status: string, durationMinutes?: number) => {
    if (status !== 'processing' || !durationMinutes) return ''
    
    if (durationMinutes <= 30) return '~8 seconds'
    if (durationMinutes <= 90) return '~20 seconds'
    return '~45 seconds'
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <span>Upload Transcript</span>
        </CardTitle>
        <CardDescription className="text-slate-600">
          Upload your sales call recordings for AI analysis and coaching insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : isUploading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full ${
              isDragActive ? 'bg-blue-200' : 
              isUploading ? 'bg-gray-200' : 'bg-gray-100'
            }`}>
              <Upload className={`h-8 w-8 ${
                isDragActive ? 'text-blue-600' : 
                isUploading ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900 mb-2">
                {isDragActive ? 'Drop files here' : 
                 isUploading ? 'Processing...' : 'Drag & drop transcript files'}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                {!isUploading && (
                  <>or <span className="text-blue-600 font-medium">browse files</span></>
                )}
              </p>
              <p className="text-xs text-slate-400">
                Supports .txt, .docx, .vtt files up to 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900">Processing Files</h4>
            {uploadFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(uploadFile.status)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {uploadFile.metadata?.title || uploadFile.file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>{formatFileSize(uploadFile.file.size)}</span>
                        {uploadFile.metadata?.participants && uploadFile.metadata.participants.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{uploadFile.metadata.participants.length} participants</span>
                          </>
                        )}
                        {uploadFile.metadata?.durationMinutes && (
                          <>
                            <span>•</span>
                            <span>{uploadFile.metadata.durationMinutes} min estimated</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(uploadFile.status)}
                    <div className="flex space-x-1">
                      {uploadFile.status === 'error' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryFile(uploadFile.id)}
                          className="h-6 w-6 p-0"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {(uploadFile.status === 'validating' || uploadFile.status === 'uploading' || uploadFile.status === 'processing') && (
                  <div className="space-y-2">
                    <Progress value={uploadFile.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        {uploadFile.status === 'validating' && 'Validating file...'}
                        {uploadFile.status === 'uploading' && 'Uploading and saving...'}
                        {uploadFile.status === 'processing' && 'AI analysis in progress...'}
                      </span>
                      <span>
                        {Math.round(uploadFile.progress)}%
                        {uploadFile.status === 'processing' && uploadFile.metadata?.durationMinutes && (
                          <span className="ml-2">
                            ({getEstimatedTime(uploadFile.status, uploadFile.metadata.durationMinutes)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {uploadFile.status === 'completed' && (
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">
                      Analysis completed! View results in Recent Transcripts.
                    </span>
                  </div>
                )}

                {/* Error Message */}
                {uploadFile.status === 'error' && uploadFile.error && (
                  <div className="flex items-start space-x-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-600 font-medium mb-1">Upload failed</p>
                      <p className="text-red-500 text-xs">{uploadFile.error}</p>
                    </div>
                  </div>
                )}

                {/* Metadata Preview for Completed Uploads */}
                {uploadFile.status === 'completed' && uploadFile.metadata && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {uploadFile.metadata.participants.length > 0 && (
                        <div>
                          <span className="text-slate-500">Participants:</span>
                          <p className="font-medium">{uploadFile.metadata.participants.join(', ')}</p>
                        </div>
                      )}
                      {uploadFile.metadata.durationMinutes && (
                        <div>
                          <span className="text-slate-500">Duration:</span>
                          <p className="font-medium">{uploadFile.metadata.durationMinutes} minutes</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
