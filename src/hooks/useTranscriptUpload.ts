
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import mammoth from 'mammoth'

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'validating' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  transcriptId?: string
  metadata?: {
    title: string
    participants: string[]
    durationMinutes?: number
  }
}

interface TranscriptMetadata {
  title: string
  participants: string[]
  meetingDate: Date
  durationMinutes?: number
}

interface UploadRequest {
  file: File
  metadata: TranscriptMetadata
  accountId?: string
}

export function useTranscriptUpload() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const queryClient = useQueryClient()

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/vtt'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Only .txt, .docx, and .vtt files are supported.`
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      return `File size must be less than 10MB.`
    }
    
    return null
  }

  const extractTextContent = async (file: File): Promise<string> => {
    switch (file.type) {
      case 'text/plain':
        return await file.text()
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        return result.value
      
      case 'text/vtt':
        const vttText = await file.text()
        // Parse VTT format and extract only the text content
        return vttText
          .split('\n')
          .filter(line => 
            !line.startsWith('WEBVTT') && 
            !line.includes('-->') && 
            line.trim() !== '' &&
            !/^\d+$/.test(line.trim())
          )
          .join(' ')
          .trim()
      
      default:
        throw new Error(`Unsupported file type: ${file.type}`)
    }
  }

  const extractMetadata = (text: string, filename: string): Partial<TranscriptMetadata> => {
    // Extract title from filename or first line
    let title = filename.replace(/\.(txt|docx|vtt)$/i, '')
    
    // Try to find a better title in the first few lines
    const lines = text.split('\n').slice(0, 5)
    for (const line of lines) {
      if (line.length > 10 && line.length < 100 && !line.includes('WEBVTT')) {
        title = line.trim()
        break
      }
    }

    // Extract participants (look for patterns like "John:", "Speaker 1:", etc.)
    const participantMatches = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*:/g)
    const participants = participantMatches 
      ? [...new Set(participantMatches.map(match => match.replace(':', '').trim()))]
      : []

    // Estimate duration based on word count (average 150 words per minute)
    const wordCount = text.split(/\s+/).length
    const estimatedDuration = Math.round(wordCount / 150)

    return {
      title,
      participants: participants.slice(0, 10), // Limit to 10 participants
      durationMinutes: estimatedDuration > 0 ? estimatedDuration : undefined
    }
  }

  const updateFileStatus = (fileId: string, updates: Partial<UploadFile>) => {
    setUploadFiles(prev => 
      prev.map(f => 
        f.id === fileId 
          ? { ...f, ...updates }
          : f
      )
    )
  }

  const uploadMutation = useMutation({
    mutationFn: async (request: UploadRequest): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Extract text content
      const textContent = await extractTextContent(request.file)
      if (!textContent.trim()) {
        throw new Error('File appears to be empty or contains no readable text')
      }

      // Insert transcript record - removed upload_source field
      const { data: transcript, error: insertError } = await supabase
        .from('transcripts')
        .insert({
          user_id: user.id,
          account_id: request.accountId,
          title: request.metadata.title,
          participants: request.metadata.participants,
          meeting_date: request.metadata.meetingDate.toISOString(),
          duration_minutes: request.metadata.durationMinutes,
          raw_text: textContent,
          status: 'uploaded'
        })
        .select()
        .single()

      if (insertError || !transcript) {
        throw new Error(`Failed to save transcript: ${insertError?.message || 'Unknown error'}`)
      }

      // Trigger analysis
      const { error: analysisError } = await supabase.functions.invoke('analyze-transcript', {
        body: {
          transcriptId: transcript.id,
          userId: user.id,
          transcriptText: textContent,
          durationMinutes: request.metadata.durationMinutes || 30,
          accountId: request.accountId
        }
      })

      if (analysisError) {
        console.warn('Analysis failed to start:', analysisError)
        // Don't throw here - transcript is saved, analysis can be retried
      }

      return transcript.id
    },
    onSuccess: (transcriptId, variables) => {
      toast.success(`Transcript "${variables.metadata.title}" uploaded successfully`)
      queryClient.invalidateQueries({ queryKey: ['transcripts'] })
    },
    onError: (error) => {
      console.error('Upload failed:', error)
      toast.error(`Upload failed: ${error.message}`)
    }
  })

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      const fileId = Math.random().toString(36).substr(2, 9)
      
      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`)
        continue
      }

      // Add to upload queue
      setUploadFiles(prev => [...prev, {
        id: fileId,
        file,
        progress: 0,
        status: 'validating'
      }])

      try {
        // Extract content and metadata
        updateFileStatus(fileId, { status: 'validating', progress: 20 })
        const textContent = await extractTextContent(file)
        
        updateFileStatus(fileId, { progress: 40 })
        const extractedMetadata = extractMetadata(textContent, file.name)
        
        const metadata: TranscriptMetadata = {
          title: extractedMetadata.title || file.name,
          participants: extractedMetadata.participants || [],
          meetingDate: new Date(),
          durationMinutes: extractedMetadata.durationMinutes
        }

        updateFileStatus(fileId, { 
          status: 'uploading',
          progress: 60,
          metadata
        })

        // Upload and trigger analysis
        const transcriptId = await uploadMutation.mutateAsync({
          file,
          metadata,
          accountId: undefined // Will be handled by account association later
        })

        updateFileStatus(fileId, {
          status: 'processing',
          progress: 80,
          transcriptId
        })

        // Mark as completed when upload is done
        // The analysis status will be tracked separately by useUploadFlow
        setTimeout(() => {
          updateFileStatus(fileId, {
            status: 'completed',
            progress: 100
          })
        }, 1000)

      } catch (error) {
        updateFileStatus(fileId, {
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const retryFile = async (fileId: string) => {
    const file = uploadFiles.find(f => f.id === fileId)
    if (!file) return

    updateFileStatus(fileId, { 
      status: 'validating', 
      progress: 0, 
      error: undefined 
    })

    // Retry the process
    processFiles([file.file])
  }

  const clearFiles = () => {
    setUploadFiles([])
  }

  return {
    uploadFiles,
    processFiles,
    removeFile,
    retryFile,
    clearFiles,
    isUploading: uploadMutation.isPending
  }
}
