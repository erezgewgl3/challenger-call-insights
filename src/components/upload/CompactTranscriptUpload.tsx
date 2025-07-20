
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TranscriptNameDialog } from './TranscriptNameDialog'
import { useTranscriptUpload } from '@/hooks/useTranscriptUpload'
import { Upload, Plus } from 'lucide-react'

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
      <Card className="h-full border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardContent className="p-4 h-full">
          <div
            {...getRootProps()}
            className={`
              h-full flex flex-col items-center justify-center text-center cursor-pointer
              ${isDragActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
              transition-colors
            `}
          >
            <input {...getInputProps()} />
            <div className="flex items-center justify-center mb-2">
              {isDragActive ? (
                <Upload className="h-6 w-6" />
              ) : (
                <Plus className="h-6 w-6" />
              )}
            </div>
            <p className="text-sm font-medium mb-1">
              {isDragActive ? 'Drop here' : 'Upload Transcript'}
            </p>
            <p className="text-xs text-muted-foreground">
              .txt, .docx, .vtt
            </p>
          </div>
        </CardContent>
      </Card>

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
