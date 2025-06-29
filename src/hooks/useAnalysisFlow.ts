
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
  analysisProgress: number
  error: string | null
  estimatedTime: string | null
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
    analysisProgress: 0,
    error: null,
    estimatedTime: null,
    uploadContext: {}
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
        // Celebration phase before showing results
        setState(prev => ({ 
          ...prev, 
          analysisProgress: 100,
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
      analysisProgress: 10,
      error: null,
      uploadContext
    }))
    
    // Complete transition after animation
    setTimeout(() => {
      setState(prev => ({ ...prev, transitionState: 'idle' }))
    }, 300)
  }, [])

  const uploadComplete = useCallback((transcriptId: string, durationMinutes?: number) => {
    const estimatedTime = durationMinutes && durationMinutes <= 30 ? '~8 seconds' : 
                         durationMinutes && durationMinutes <= 90 ? '~25 seconds' : '~60 seconds'
    
    setState(prev => ({
      ...prev,
      currentTranscriptId: transcriptId,
      analysisProgress: 40,
      estimatedTime
    }))
  }, [])

  const uploadError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      analysisProgress: 0,
      transitionState: 'idle'
    }))
  }, [])

  const retryUpload = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentView: 'dashboard',
      transitionState: 'transitioning',
      error: null,
      analysisProgress: 0,
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
      analysisProgress: 0,
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
      analysisProgress: 0,
      error: null,
      uploadContext: {}
    }))
    
    setTimeout(() => {
      setState(prev => ({ ...prev, transitionState: 'idle' }))
    }, 300)
  }, [])

  return {
    ...state,
    startUpload,
    uploadComplete,
    uploadError,
    retryUpload,
    uploadAnother,
    viewResults,
    backToDashboard
  }
}
