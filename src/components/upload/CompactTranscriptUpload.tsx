
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TranscriptNameDialog } from './TranscriptNameDialog'
import { useTranscriptUpload } from '@/hooks/useTranscriptUpload'
import { Upload, Plus, FileText, Info, Eye, MessageSquare, ArrowRight } from 'lucide-react'

interface CompactTranscriptUploadProps {
  onAnalysisComplete?: (transcriptId: string) => void
}

export function CompactTranscriptUpload({ onAnalysisComplete }: CompactTranscriptUploadProps) {
  const { uploadFiles, processFiles, isUploading } = useTranscriptUpload(onAnalysisComplete)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showNameDialog, setShowNameDialog] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setPendingFile(file)
      setShowNameDialog(true)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/vtt': ['.vtt']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  })

  const handleNameConfirm = (customName: string) => {
    if (pendingFile) {
      processFiles([pendingFile], customName)
      setPendingFile(null)
      setShowNameDialog(false)
    }
  }

  const handleNameCancel = () => {
    setPendingFile(null)
    setShowNameDialog(false)
  }

  const getDefaultName = (file: File) => {
    return file.name.replace(/\.[^/.]+$/, "")
  }

  // Show upload progress if files are being processed
  if (uploadFiles.length > 0) {
    const file = uploadFiles[0]
    return (
      <Card className="h-full">
        <CardContent className="p-4 flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Processing...</p>
            <p className="text-xs text-muted-foreground">{file.file.name}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1 rounded-xl">
        <Card className="bg-white rounded-lg">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer
                ${isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-gray-50'}
                transition-all duration-200
              `}
            >
              <input {...getInputProps()} />
              <div className="flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop here' : 'Drag & drop transcript or'} <span className="text-blue-500 underline">browse files</span>
              </p>
              <p className="text-sm text-gray-500">
                Supports .txt, .docx, and .vtt files up to 10MB
              </p>
            </div>
            
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Info className="h-3 w-3 text-emerald-600" />
                </div>
                <h3 className="font-medium text-gray-900">What You'll Get</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Client intelligence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Strategic insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Follow-up content</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Next steps</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TranscriptNameDialog
        isOpen={showNameDialog}
        onClose={handleNameCancel}
        onConfirm={handleNameConfirm}
        file={pendingFile}
        defaultName={pendingFile ? getDefaultName(pendingFile) : ''}
      />
    </>
  )
}
