
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type UploadStatus = 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error'

interface UploadFile {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error?: string
  transcriptId?: string
  metadata?: {
    title: string
    participants: string[]
    meetingDate: string
    durationMinutes: number
  }
}

export function useTranscriptUpload(onAnalysisComplete?: (transcriptId: string) => void) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])

  const updateFileStatus = useCallback((fileId: string, updates: Partial<UploadFile>) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, ...updates } : file
    ))
  }, [])

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        resolve(content)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const extractMetadataFromText = (text: string, fileName: string) => {
    // Simple metadata extraction
    const lines = text.split('\n').filter(line => line.trim())
    const title = fileName.replace(/\.[^/.]+$/, "") // Remove extension
    
    // Try to extract participants from common patterns
    const participants: string[] = []
    const participantPatterns = [
      /^([A-Z][a-z]+ [A-Z][a-z]+):/,
      /^([A-Z][a-z]+):/,
      /Speaker \d+/
    ]
    
    lines.forEach(line => {
      participantPatterns.forEach(pattern => {
        const match = line.match(pattern)
        if (match && !participants.includes(match[1])) {
          participants.push(match[1])
        }
      })
    })

    // Estimate duration based on content length (rough estimate)
    const estimatedDuration = Math.max(5, Math.min(120, Math.floor(text.length / 1000)))

    return {
      title,
      participants: participants.length > 0 ? participants : ['Speaker 1', 'Speaker 2'],
      meetingDate: new Date().toISOString(),
      durationMinutes: estimatedDuration
    }
  }

  const processFiles = useCallback(async (files: File[]) => {
    const newFiles: UploadFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'validating' as UploadStatus,
      progress: 0
    }))

    setUploadFiles(prev => [...prev, ...newFiles])

    for (const uploadFile of newFiles) {
      try {
        // Validation phase
        updateFileStatus(uploadFile.id, { status: 'validating', progress: 20 })
        
        // Extract text content
        const textContent = await extractTextFromFile(uploadFile.file)
        updateFileStatus(uploadFile.id, { progress: 40 })
        
        // Extract metadata
        const metadata = extractMetadataFromText(textContent, uploadFile.file.name)
        updateFileStatus(uploadFile.id, { metadata, progress: 60 })

        // Upload phase
        updateFileStatus(uploadFile.id, { status: 'uploading', progress: 70 })

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Create transcript record
        const { data: transcript, error: transcriptError } = await supabase
          .from('transcripts')
          .insert({
            user_id: user.id,
            title: metadata.title,
            participants: metadata.participants,
            meeting_date: metadata.meetingDate,
            duration_minutes: metadata.durationMinutes,
            raw_text: textContent,
            status: 'uploaded'
          })
          .select()
          .single()

        if (transcriptError) throw transcriptError

        updateFileStatus(uploadFile.id, { 
          transcriptId: transcript.id,
          status: 'processing',
          progress: 80
        })

        // Start AI analysis
        const analysisResponse = await supabase.functions.invoke('analyze-transcript', {
          body: {
            transcriptId: transcript.id,
            userId: user.id,
            transcriptText: textContent,
            durationMinutes: metadata.durationMinutes
          }
        })

        if (analysisResponse.error) {
          console.error('Analysis failed:', analysisResponse.error)
          updateFileStatus(uploadFile.id, {
            status: 'error',
            error: 'Analysis failed to start'
          })
          continue
        }

        // Poll for completion
        let attempts = 0
        const maxAttempts = 30 // 30 seconds max wait
        
        const pollForCompletion = async () => {
          const { data: transcriptStatus } = await supabase
            .from('transcripts')
            .select('status, error_message')
            .eq('id', transcript.id)
            .single()

          if (transcriptStatus?.status === 'completed') {
            updateFileStatus(uploadFile.id, {
              status: 'completed',
              progress: 100
            })
            
            toast.success(`Analysis complete for ${uploadFile.file.name}`)
            
            // Auto-navigate after brief delay
            setTimeout(() => {
              onAnalysisComplete?.(transcript.id)
            }, 2000)
          } else if (transcriptStatus?.status === 'error') {
            updateFileStatus(uploadFile.id, {
              status: 'error',
              error: transcriptStatus.error_message || 'Analysis failed'
            })
          } else if (attempts < maxAttempts) {
            attempts++
            setTimeout(pollForCompletion, 1000)
          } else {
            updateFileStatus(uploadFile.id, {
              status: 'error',
              error: 'Analysis timed out'
            })
          }
        }

        setTimeout(pollForCompletion, 2000) // Start polling after 2 seconds

      } catch (error) {
        console.error('Upload failed:', error)
        updateFileStatus(uploadFile.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        })
        toast.error(`Upload failed: ${uploadFile.file.name}`)
      }
    }
  }, [updateFileStatus, onAnalysisComplete])

  const removeFile = useCallback((fileId: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  const retryFile = useCallback((fileId: string) => {
    const file = uploadFiles.find(f => f.id === fileId)
    if (file) {
      processFiles([file.file])
      removeFile(fileId)
    }
  }, [uploadFiles, processFiles, removeFile])

  const clearFiles = useCallback(() => {
    setUploadFiles([])
  }, [])

  const isUploading = uploadFiles.some(file => 
    ['validating', 'uploading', 'processing'].includes(file.status)
  )

  return {
    uploadFiles,
    processFiles,
    removeFile,
    retryFile,
    clearFiles,
    isUploading
  }
}
