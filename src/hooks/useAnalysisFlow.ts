
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus'
import { toast } from 'sonner'

type FlowView = 'dashboard' | 'progress' | 'results'
type TransitionState = 'idle' | 'transitioning' | 'celebrating'

interface AnalysisFlowState {
  currentView: FlowView
  transitionState: TransitionState
  currentTranscriptId: string | null
  error: string | null
  uploadContext: {
    fileName?: string
    fileSize?: number
    fileDuration?: number
  }
}

export function useAnalysisFlow() {
  const [state, setState] = useState<AnalysisFlowState>({
    currentView: 'dashboard',
    transitionState: 'idle',
    currentTranscriptId: null,
    error: null,
    uploadContext: {}
  })
  
  const navigate = useNavigate()
  const { status: analysisStatus } = useAnalysisStatus(state.currentTranscriptId || undefined)

  // Handle status changes from real analysis status
  useEffect(() => {
    if (!state.currentTranscriptId || !analysisStatus) return

    switch (analysisStatus.status) {
      case 'completed':
        // Celebration phase before showing results
        setState(prev => ({ 
          ...prev, 
          transitionState: 'celebrating'
        }))
        
        // Show celebration, then transition to results
        setTimeout(() => {
          setState(prev => ({ 
            ...prev, 
            currentView: 'results',
            transitionState: 'idle'
          }))
        }, 1500)
        break
      case 'error':
        setState(prev => ({ 
          ...prev, 
          error: 'Analysis failed. Please try again.',
          transitionState: 'idle'
        }))
        break
    }
  }, [analysisStatus, state.currentTranscriptId])

  const startUpload = useCallback((uploadContext: AnalysisFlowState['uploadContext']) => {
    setState(prev => ({
      ...prev,
      currentView: 'progress',
      transitionState: 'transitioning',
      error: null,
      uploadContext
    }))
    
    // Complete transition after animation
    setTimeout(() => {
      setState(prev => ({ ...prev, transitionState: 'idle' }))
    }, 300)
  }, [])

  const uploadComplete = useCallback((transcriptId: string, durationMinutes?: number) => {
    setState(prev => ({
      ...prev,
      currentTranscriptId: transcriptId
    }))
  }, [])

  const uploadError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      transitionState: 'idle'
    }))
  }, [])

  const retryUpload = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentView: 'dashboard',
      transitionState: 'transitioning',
      error: null,
      currentTranscriptId: null,
      uploadContext: {}
    }))
    
    setTimeout(() => {
      setState(prev => ({ ...prev, transitionState: 'idle' }))
    }, 300)
  }, [])

  const uploadAnother = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentView: 'dashboard',
      transitionState: 'transitioning',
      error: null,
      currentTranscriptId: null,
      uploadContext: {}
    }))
    
    setTimeout(() => {
      setState(prev => ({ ...prev, transitionState: 'idle' }))
    }, 300)
    
    toast.success('Ready for your next analysis!', {
      duration: 2000
    })
  }, [])

  const viewResults = useCallback(() => {
    if (state.currentTranscriptId) {
      navigate(`/analysis/${state.currentTranscriptId}`)
    }
  }, [state.currentTranscriptId, navigate])

  const backToDashboard = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentView: 'dashboard',
      transitionState: 'transitioning',
      currentTranscriptId: null,
      error: null,
      uploadContext: {}
    }))
    
    setTimeout(() => {
      setState(prev => ({ ...prev, transitionState: 'idle' }))
    }, 300)
  }, [])

  return {
    ...state,
    analysisStatus,
    startUpload,
    uploadComplete,
    uploadError,
    retryUpload,
    uploadAnother,
    viewResults,
    backToDashboard
  }
}
