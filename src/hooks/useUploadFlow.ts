
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus'
import { toast } from 'sonner'

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

interface UploadFlowState {
  uploadStatus: UploadStatus
  currentTranscriptId: string | null
  analysisProgress: number
  error: string | null
  estimatedTime: string | null
}

export function useUploadFlow() {
  const [state, setState] = useState<UploadFlowState>({
    uploadStatus: 'idle',
    currentTranscriptId: null,
    analysisProgress: 0,
    error: null,
    estimatedTime: null
  })
  
  const navigate = useNavigate()
  const { status: analysisStatus } = useAnalysisStatus(state.currentTranscriptId || undefined)

  // Enhanced progress mapping based on analysis status
  useEffect(() => {
    if (!state.currentTranscriptId || !analysisStatus) return

    switch (analysisStatus.status) {
      case 'uploaded':
        // File uploaded, starting processing
        setState(prev => ({ ...prev, analysisProgress: 20 }))
        break
      case 'processing':
        // AI analysis in progress - simulate gradual progress
        setState(prev => ({ ...prev, analysisProgress: 45 }))
        
        // Simulate intermediate progress updates during processing
        const progressInterval = setInterval(() => {
          setState(prev => {
            if (prev.analysisProgress < 85) {
              return { ...prev, analysisProgress: prev.analysisProgress + 5 }
            }
            return prev
          })
        }, 2000) // Update every 2 seconds
        
        return () => clearInterval(progressInterval)
        
      case 'completed':
        setState(prev => ({ 
          ...prev, 
          uploadStatus: 'completed', 
          analysisProgress: 100 
        }))
        // Auto-navigate to results after completion celebration
        setTimeout(() => {
          navigate(`/analysis/${state.currentTranscriptId}`)
        }, 1500)
        break
      case 'error':
        setState(prev => ({ 
          ...prev, 
          uploadStatus: 'error', 
          error: 'Analysis failed. Please try again.' 
        }))
        break
    }
  }, [analysisStatus, state.currentTranscriptId, navigate])

  const calculateEstimatedTime = (durationMinutes?: number) => {
    if (!durationMinutes) return '~8 seconds'
    
    if (durationMinutes <= 5) return '~8 seconds'
    if (durationMinutes <= 30) return '~25 seconds'
    if (durationMinutes <= 60) return '~45 seconds'
    return '~60 seconds'
  }

  const startUpload = useCallback(() => {
    setState({
      uploadStatus: 'uploading',
      currentTranscriptId: null,
      analysisProgress: 5, // Start with small progress
      error: null,
      estimatedTime: null
    })
  }, [])

  const uploadComplete = useCallback((transcriptId: string, durationMinutes?: number) => {
    const estimatedTime = calculateEstimatedTime(durationMinutes)
    
    setState(prev => ({
      ...prev,
      uploadStatus: 'processing',
      currentTranscriptId: transcriptId,
      analysisProgress: 15, // File uploaded successfully
      estimatedTime
    }))
  }, [])

  const uploadError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      uploadStatus: 'error',
      error,
      analysisProgress: 0
    }))
  }, [])

  const resetFlow = useCallback(() => {
    setState({
      uploadStatus: 'idle',
      currentTranscriptId: null,
      analysisProgress: 0,
      error: null,
      estimatedTime: null
    })
  }, [])

  return {
    ...state,
    startUpload,
    uploadComplete,
    uploadError,
    resetFlow
  }
}
