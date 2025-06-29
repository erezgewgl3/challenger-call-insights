
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export function TranscriptUpload() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      toast.error(`${rejection.file.name}: ${rejection.errors[0]?.message}`)
    })

    // Process accepted files
    acceptedFiles.forEach((file) => {
      const uploadFile: UploadFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'uploading'
      }

      setUploadFiles(prev => [...prev, uploadFile])

      // Simulate upload progress
      simulateUpload(uploadFile.id)
    })
  }, [])

  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: 100, status: 'completed' }
              : f
          )
        )
        clearInterval(interval)
        toast.success('Transcript uploaded successfully')
      } else {
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress }
              : f
          )
        )
      }
    }, 500)
  }

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
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
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-200' : 'bg-gray-100'}`}>
              <Upload className={`h-8 w-8 ${isDragActive ? 'text-blue-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900 mb-2">
                {isDragActive ? 'Drop files here' : 'Drag & drop transcript files'}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                or <span className="text-blue-600 font-medium">browse files</span>
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
            <h4 className="font-medium text-slate-900">Uploading Files</h4>
            {uploadFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-sm text-slate-900">{uploadFile.file.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(uploadFile.file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadFile.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
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
                {uploadFile.status === 'uploading' && (
                  <div className="space-y-1">
                    <Progress value={uploadFile.progress} className="h-2" />
                    <p className="text-xs text-slate-500">{Math.round(uploadFile.progress)}% uploaded</p>
                  </div>
                )}
                {uploadFile.status === 'completed' && (
                  <p className="text-xs text-green-600 font-medium">Upload completed</p>
                )}
                {uploadFile.status === 'error' && (
                  <p className="text-xs text-red-600">{uploadFile.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
