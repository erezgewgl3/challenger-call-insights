
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus'
import { toast } from 'sonner'

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

interface UploadFlowState {
  uploadStatus: UploadStatus
  currentTranscriptId: string | null
  error: string | null
}

export function useUploadFlow() {
  const [state, setState] = useState<UploadFlowState>({
    uploadStatus: 'idle',
    currentTranscriptId: null,
    error: null
  })
  
  const navigate = useNavigate()
  const { status: analysisStatus } = useAnalysisStatus(state.currentTranscriptId || undefined)

  // Handle analysis status changes
  useEffect(() => {
    if (!state.currentTranscriptId || !analysisStatus) return

    switch (analysisStatus.status) {
      case 'processing':
        setState(prev => ({ ...prev, uploadStatus: 'processing' }))
        break
      case 'completed':
        setState(prev => ({ ...prev, uploadStatus: 'completed' }))
        // Auto-navigate to results after completion
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
      error: null
    })
  }, [])

  const uploadComplete = useCallback((transcriptId: string) => {
    setState(prev => ({
      ...prev,
      uploadStatus: 'processing',
      currentTranscriptId: transcriptId
    }))
  }, [])

  const uploadError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      uploadStatus: 'error',
      error
    }))
  }, [])

  const resetFlow = useCallback(() => {
    setState({
      uploadStatus: 'idle',
      currentTranscriptId: null,
      error: null
    })
  }, [])

  return {
    ...state,
    analysisStatus,
    startUpload,
    uploadComplete,
    uploadError,
    resetFlow
  }
}
