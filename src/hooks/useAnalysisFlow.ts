
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

  // Calculate more accurate time estimation based on file characteristics
  const calculateEstimatedTime = (durationMinutes?: number) => {
    if (!durationMinutes) return '30-60 seconds'
    
    // More realistic time estimates based on actual AI processing
    if (durationMinutes <= 5) return '20-40 seconds'
    if (durationMinutes <= 15) return '40-60 seconds'
    if (durationMinutes <= 30) return '60-90 seconds'
    if (durationMinutes <= 60) return '90-120 seconds'
    return '2-3 minutes'
  }

  // Use real progress from database, no fake simulation
  useEffect(() => {
    if (!state.currentTranscriptId || !analysisStatus) return

    // Update progress with real data from Edge Function
    setState(prev => ({
      ...prev,
      analysisProgress: analysisStatus.progress || 0
    }))

    switch (analysisStatus.status) {
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
    const estimatedTime = calculateEstimatedTime(uploadContext.fileDuration)
    
    setState(prev => ({
      ...prev,
      currentView: 'progress',
      transitionState: 'transitioning',
      analysisProgress: 5, // Start with minimal progress
      error: null,
      estimatedTime,
      uploadContext
    }))
    
    // Complete transition after animation
    setTimeout(() => {
      setState(prev => ({ ...prev, transitionState: 'idle' }))
    }, 300)
  }, [])

  const uploadComplete = useCallback((transcriptId: string, durationMinutes?: number) => {
    const estimatedTime = calculateEstimatedTime(durationMinutes)
    
    setState(prev => ({
      ...prev,
      currentTranscriptId: transcriptId,
      analysisProgress: 15, // File uploaded successfully
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
