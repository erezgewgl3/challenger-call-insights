
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

  // Update progress based on analysis status
  useEffect(() => {
    if (!state.currentTranscriptId || !analysisStatus) return

    switch (analysisStatus.status) {
      case 'uploaded':
        setState(prev => ({ ...prev, analysisProgress: 25 }))
        break
      case 'processing':
        setState(prev => ({ ...prev, analysisProgress: 60 }))
        break
      case 'completed':
        setState(prev => ({ 
          ...prev, 
          uploadStatus: 'completed', 
          analysisProgress: 100 
        }))
        // Auto-navigate to results after a brief delay
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

  const startUpload = useCallback(() => {
    setState({
      uploadStatus: 'uploading',
      currentTranscriptId: null,
      analysisProgress: 10,
      error: null,
      estimatedTime: null
    })
  }, [])

  const uploadComplete = useCallback((transcriptId: string, durationMinutes?: number) => {
    const estimatedTime = durationMinutes && durationMinutes <= 30 ? '~8 seconds' : 
                         durationMinutes && durationMinutes <= 90 ? '~20 seconds' : '~45 seconds'
    
    setState(prev => ({
      ...prev,
      uploadStatus: 'processing',
      currentTranscriptId: transcriptId,
      analysisProgress: 40,
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
