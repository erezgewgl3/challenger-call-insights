
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TranscriptNameDialog } from './TranscriptNameDialog'
import { ProcessingStatus } from './ProcessingStatus'
import { useTranscriptUpload } from '@/hooks/useTranscriptUpload'
import { useAuth } from '@/hooks/useAuth'
import { Upload, Plus, FileText, Info, Eye, MessageSquare, ArrowRight } from 'lucide-react'

interface CompactTranscriptUploadProps {
  onAnalysisComplete?: (transcriptId: string) => void
}

export function CompactTranscriptUpload({ onAnalysisComplete }: CompactTranscriptUploadProps) {
  const { user } = useAuth()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Initialize upload hook with error handling
  let uploadHook
  try {
    uploadHook = useTranscriptUpload(onAnalysisComplete)
  } catch (error) {
    console.error('Failed to initialize upload hook:', error)
    setHasError(true)
  }

  const { uploadFiles, processFiles, isUploading } = uploadHook || {
    uploadFiles: [],
    processFiles: () => Promise.resolve(),
    isUploading: false
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    try {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setPendingFile(file)
        setShowNameDialog(true)
      }
    } catch (error) {
      console.error('Error handling file drop:', error)
      setHasError(true)
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

  const handleNameConfirm = useCallback((customName: string) => {
    try {
      if (pendingFile && processFiles) {
        processFiles([pendingFile], customName)
        setPendingFile(null)
        setShowNameDialog(false)
      }
    } catch (error) {
      console.error('Error processing file:', error)
      setHasError(true)
    }
  }, [pendingFile, processFiles])

  const handleNameCancel = useCallback(() => {
    setPendingFile(null)
    setShowNameDialog(false)
  }, [])

  const getDefaultName = useCallback((file: File) => {
    return file.name.replace(/\.[^/.]+$/, "")
  }, [])

  // Error fallback UI
  if (hasError) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 flex items-center justify-center h-full">
          <div className="text-center">
            <Info className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Upload temporarily unavailable. Please refresh the page.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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
          <CardContent className="p-4">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer
                ${isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-gray-50'}
                transition-all duration-200
              `}
            >
              <input {...getInputProps()} />
              <div className="flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-2">
                {isDragActive ? 'Drop here' : 'Drag & drop transcript or'} <span className="text-blue-500 underline">browse files</span>
              </p>
              <p className="text-sm text-gray-500">
                Supports .txt, .docx, and .vtt files up to 10MB
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span>Client intelligence</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Strategic insights</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Follow-up content</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span>Next steps</span>
                </div>
              </div>
              
              {/* Contextual status - only shows when relevant */}
              {user?.id && <ProcessingStatus user_id={user.id} />}
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
