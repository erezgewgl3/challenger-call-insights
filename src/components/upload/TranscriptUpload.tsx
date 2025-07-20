
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadProgress } from './UploadProgress'
import { TranscriptNameDialog } from './TranscriptNameDialog'
import { useTranscriptUpload } from '@/hooks/useTranscriptUpload'
import { Upload, FileText, Zap, Brain, Target, MessageSquare, ArrowRight } from 'lucide-react'

interface TranscriptUploadProps {
  onAnalysisComplete?: (transcriptId: string) => void
}

export function TranscriptUpload({ onAnalysisComplete }: TranscriptUploadProps) {
  const { uploadFiles, processFiles, removeFile, retryFile, clearFiles, isUploading } = useTranscriptUpload(onAnalysisComplete)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showNameDialog, setShowNameDialog] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0] // Only handle single file
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
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false // Single file only
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

  const handleClearAll = () => {
    clearFiles()
  }

  const getDefaultName = (file: File) => {
    return file.name.replace(/\.[^/.]+$/, "") // Remove extension
  }

  return (
    <>
      {/* Hero Upload Card */}
      <Card className="shadow-xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 border-0 overflow-hidden">
        <CardContent className="p-8">
          {/* Large Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
              ${isDragActive 
                ? 'border-white bg-white/20 transform scale-[1.02]' 
                : 'border-white/40 hover:border-white hover:bg-white/10 hover:transform hover:scale-[1.01]'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <Upload className="h-12 w-12 text-white" />
                </div>
              </div>
              
              {isDragActive ? (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Drop your transcript here</h3>
                  <p className="text-lg text-white/80">Release to start AI analysis</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-3xl font-bold text-white mb-3">
                    Drag & drop your transcript or <span className="underline">browse files</span>
                  </h3>
                  <p className="text-lg text-white/80 mb-4">
                    Upload .txt, .docx, or .vtt files up to 10MB
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-white/70">
                    <FileText className="w-5 h-5" />
                    <span>•</span>
                    <span className="text-sm">Secure & Private</span>
                    <span>•</span>
                    <span className="text-sm">AI Analysis in Seconds</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploadFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Processing Your Transcript</h4>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleClearAll}
                  disabled={isUploading}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-3">
                {uploadFiles.map((file) => (
                  <div key={file.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <UploadProgress
                      uploadStatus={file.status}
                      analysisProgress={file.progress}
                      error={file.error || null}
                      onRetry={() => retryFile(file.id)}
                      onUploadAnother={handleClearAll}
                      fileName={file.file.name}
                      fileSize={file.file.size}
                      fileDuration={file.metadata?.durationMinutes}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What You'll Get Section */}
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-white/20 rounded-full">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white">What You'll Get</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-default">
                <div className="p-2 bg-emerald-100/20 rounded-full group-hover:bg-emerald-100/30 transition-colors">
                  <Brain className="w-5 h-5 text-emerald-200" />
                </div>
                <span className="text-sm font-medium text-white group-hover:text-emerald-100 transition-colors">Client Intelligence</span>
              </div>
              <div className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-default">
                <div className="p-2 bg-blue-100/20 rounded-full group-hover:bg-blue-100/30 transition-colors">
                  <Target className="w-5 h-5 text-blue-200" />
                </div>
                <span className="text-sm font-medium text-white group-hover:text-blue-100 transition-colors">Strategic Insights</span>
              </div>
              <div className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-default">
                <div className="p-2 bg-purple-100/20 rounded-full group-hover:bg-purple-100/30 transition-colors">
                  <MessageSquare className="w-5 h-5 text-purple-200" />
                </div>
                <span className="text-sm font-medium text-white group-hover:text-purple-100 transition-colors">Follow-up Content</span>
              </div>
              <div className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-default">
                <div className="p-2 bg-orange-100/20 rounded-full group-hover:bg-orange-100/30 transition-colors">
                  <ArrowRight className="w-5 h-5 text-orange-200" />
                </div>
                <span className="text-sm font-medium text-white group-hover:text-orange-100 transition-colors">Next Steps</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Name Dialog */}
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
