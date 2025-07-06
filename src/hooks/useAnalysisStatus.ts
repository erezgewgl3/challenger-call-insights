
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AnalysisStatus {
  transcriptId: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
  progress?: number
  phase?: string
  message?: string
  estimatedTimeRemaining?: number
  error?: string
}

interface ProgressData {
  transcript_id: string
  progress: number
  phase: string
  message: string | null
  updated_at: string
}

export function useAnalysisStatus(transcriptId?: string) {
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!transcriptId) return

    const fetchStatus = async () => {
      setIsLoading(true)
      try {
        // Get transcript status
        const { data: transcript, error } = await supabase
          .from('transcripts')
          .select('id, status, title, duration_minutes')
          .eq('id', transcriptId)
          .single()

        if (error) throw error

        // Get progress data if available
        const { data: progressData } = await supabase
          .from('transcript_progress')
          .select('*')
          .eq('transcript_id', transcriptId)
          .single()

        setStatus({
          transcriptId,
          status: transcript.status,
          progress: progressData?.progress || (transcript.status === 'completed' ? 100 : 0),
          phase: progressData?.phase || 'starting',
          message: progressData?.message || undefined
        })
      } catch (error) {
        console.error('Failed to fetch analysis status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()

    // Set up real-time subscription for transcript updates
    const transcriptChannel = supabase
      .channel('transcript-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transcripts',
          filter: `id=eq.${transcriptId}`
        },
        (payload) => {
          const updatedTranscript = payload.new as any
          setStatus(prev => prev ? {
            ...prev,
            status: updatedTranscript.status,
            progress: updatedTranscript.status === 'completed' ? 100 : prev.progress
          } : null)

          // Show completion notification
          if (updatedTranscript.status === 'completed') {
            toast.success('Analysis completed! View your insights now.', {
              duration: 5000,
              action: {
                label: 'View Results',
                onClick: () => {
                  window.location.hash = `#transcript-${transcriptId}`
                }
              }
            })
          } else if (updatedTranscript.status === 'error') {
            toast.error('Analysis failed. Please try again.')
          }
        }
      )
      .subscribe()

    // Set up real-time subscription for progress updates  
    const progressChannel = supabase
      .channel('progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'transcript_progress',
          filter: `transcript_id=eq.${transcriptId}`
        },
        (payload) => {
          const progressUpdate = payload.new as ProgressData
          console.log('🔍 [REALTIME] Progress update received:', progressUpdate)
          
          setStatus(prev => prev ? {
            ...prev,
            progress: progressUpdate.progress,
            phase: progressUpdate.phase,
            message: progressUpdate.message || undefined
          } : null)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(transcriptChannel)
      supabase.removeChannel(progressChannel)
    }
  }, [transcriptId])

  return { status, isLoading }
}
