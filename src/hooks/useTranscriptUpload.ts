import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
// @ts-ignore - mammoth types may not be available
import mammoth from 'mammoth'
import { validateFileSecurely, sanitizeFileName, getClientIP } from '@/utils/fileSecurityUtils'

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
    const fileName = file.name.toLowerCase()
    
    if (fileName.endsWith('.docx')) {
      // Handle Word documents using mammoth
      try {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        return result.value
      } catch (error) {
        throw new Error('Failed to extract text from Word document')
      }
    } else {
      // Handle text files (.txt, .vtt) using FileReader
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
  }

  const extractMetadataFromText = (text: string, fileName: string, customTitle?: string) => {
    // Simple metadata extraction
    const lines = text.split('\n').filter(line => line.trim())
    const title = customTitle || fileName.replace(/\.[^/.]+$/, "") // Use custom title if provided
    
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

  const processFiles = useCallback(async (files: File[], customName?: string) => {
    const newFiles: UploadFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'validating' as UploadStatus,
      progress: 0
    }))

    setUploadFiles(prev => [...prev, ...newFiles])

    // Get authenticated user once at the start
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const errorMsg = 'User not authenticated'
      newFiles.forEach(uploadFile => {
        updateFileStatus(uploadFile.id, {
          status: 'error',
          error: errorMsg
        })
      })
      return
    }

    for (const uploadFile of newFiles) {
      try {
        // Enhanced security validation phase
        updateFileStatus(uploadFile.id, { status: 'validating', progress: 10 })
        
        // Sanitize filename to prevent path traversal attacks
        const sanitizedFileName = sanitizeFileName(uploadFile.file.name)
        
        // Perform comprehensive client-side security validation
        const securityValidation = await validateFileSecurely(uploadFile.file)
        
        updateFileStatus(uploadFile.id, { progress: 20 })
        
        // Handle security validation results
        if (!securityValidation.valid) {
          throw new Error(securityValidation.errors.join('; '))
        }
        
        // Show warnings but don't block (for non-critical security issues)
        if (securityValidation.warnings.length > 0) {
          console.warn('File security warnings:', securityValidation.warnings)
          toast.info(`Security notice: ${securityValidation.warnings[0]}`)
        }

        // Get client IP for enhanced server-side validation
        const clientIP = getClientIP()
        
        // Extract text content early for server-side validation
        updateFileStatus(uploadFile.id, { progress: 30 })
        const textContent = await extractTextFromFile(uploadFile.file)
        
        // Call enhanced server-side validation with content
        try {
          const { data: validationResult, error: validationError } = await supabase.rpc('enhanced_file_validation', {
            p_file_name: sanitizedFileName,
            p_file_size: uploadFile.file.size,
            p_content_type: uploadFile.file.type,
            p_user_id: user.id,
            p_ip_address: clientIP,
            p_file_content: textContent
          })
          
          if (validationError) {
            console.error('Server validation error:', validationError)
            throw new Error('File validation failed on server')
          }
          
          // Type guard for validation result
          const result = validationResult as any
          if (result && typeof result === 'object' && !result.valid) {
            throw new Error(result.error || 'File validation failed')
          }
          
          // Log successful enhanced validation
          console.log('Enhanced file validation passed:', validationResult)
          
        } catch (validationError) {
          console.error('Enhanced validation failed:', validationError)
          // Fallback to basic validation for backward compatibility
          const allowedTypes = ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/vtt']
          const maxSize = 10 * 1024 * 1024 // 10MB
          
          if (!allowedTypes.includes(uploadFile.file.type)) {
            throw new Error('Invalid file type. Only .txt, .docx, and .vtt files are allowed')
          }
          
          if (uploadFile.file.size > maxSize) {
            throw new Error('File size exceeds 10MB limit')
          }
          
          // Log fallback to basic validation
          try {
            await supabase.rpc('log_security_event', {
              p_event_type: 'file_upload_fallback_validation',
              p_user_id: user.id,
              p_details: {
                file_name: sanitizedFileName,
                file_size: uploadFile.file.size,
                content_type: uploadFile.file.type,
                fallback_reason: validationError instanceof Error ? validationError.message : 'Unknown validation error'
              }
            })
          } catch (logError) {
            console.warn('Failed to log security event:', logError)
          }
        }
        
        updateFileStatus(uploadFile.id, { progress: 40 })
        
        // Extract metadata with custom name
        const metadata = extractMetadataFromText(textContent, sanitizedFileName, customName)
        updateFileStatus(uploadFile.id, { metadata, progress: 60 })

        // Upload phase
        updateFileStatus(uploadFile.id, { status: 'uploading', progress: 70 })

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
