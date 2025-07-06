
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AnalysisStatus {
  transcriptId: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
  progress: number
  phase: string
  message: string
  error?: string
}

export function useAnalysisStatus(transcriptId?: string) {
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!transcriptId) return

    const fetchStatus = async () => {
      setIsLoading(true)
      try {
        const { data: transcript, error } = await supabase
          .from('transcripts')
          .select('id, status, title, duration_minutes')
          .eq('id', transcriptId)
          .single()

        if (error) throw error

        // Simple 3-state progress system
        let progress = 0
        let phase = 'starting'
        let message = 'Starting analysis...'

        switch (transcript.status) {
          case 'uploaded':
            progress = 33
            phase = 'processing'
            message = 'Processing transcript...'
            break
          case 'processing':
            progress = 66
            phase = 'analyzing'
            message = 'AI analyzing conversation...'
            break
          case 'completed':
            progress = 100
            phase = 'completed'
            message = 'Analysis complete!'
            break
          case 'error':
            progress = 0
            phase = 'error'
            message = 'Analysis failed'
            break
        }

        setStatus({
          transcriptId,
          status: transcript.status,
          progress,
          phase,
          message
        })
      } catch (error) {
        console.error('Failed to fetch analysis status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()

    // Set up real-time subscription for transcript status changes only
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
          
          // Update status based on transcript status change
          let progress = 0
          let phase = 'starting'
          let message = 'Starting analysis...'

          switch (updatedTranscript.status) {
            case 'uploaded':
              progress = 33
              phase = 'processing'
              message = 'Processing transcript...'
              break
            case 'processing':
              progress = 66
              phase = 'analyzing'
              message = 'AI analyzing conversation...'
              break
            case 'completed':
              progress = 100
              phase = 'completed'
              message = 'Analysis complete!'
              toast.success('Analysis completed! View your insights now.', {
                duration: 5000,
                action: {
                  label: 'View Results',
                  onClick: () => {
                    window.location.hash = `#transcript-${transcriptId}`
                  }
                }
              })
              break
            case 'error':
              progress = 0
              phase = 'error'
              message = 'Analysis failed'
              toast.error('Analysis failed. Please try again.')
              break
          }

          setStatus(prev => prev ? {
            ...prev,
            status: updatedTranscript.status,
            progress,
            phase,
            message
          } : null)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(transcriptChannel)
    }
  }, [transcriptId])

  return { status, isLoading }
}
