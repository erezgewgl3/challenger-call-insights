
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AnalysisStatus {
  transcriptId: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
  progress?: number
  estimatedTimeRemaining?: number
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
        // Get transcript status
        const { data: transcript, error } = await supabase
          .from('transcripts')
          .select('id, status, title')
          .eq('id', transcriptId)
          .single()

        if (error) throw error

        setStatus({
          transcriptId,
          status: transcript.status,
          progress: transcript.status === 'completed' ? 100 : 
                   transcript.status === 'processing' ? 50 : 0
        })
      } catch (error) {
        console.error('Failed to fetch analysis status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()

    // Set up real-time subscription
    const channel = supabase
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
            progress: updatedTranscript.status === 'completed' ? 100 : 
                     updatedTranscript.status === 'processing' ? 75 : 50
          } : null)

          // Show completion notification
          if (updatedTranscript.status === 'completed') {
            toast.success('Analysis completed! View your insights now.', {
              duration: 5000,
              action: {
                label: 'View Results',
                onClick: () => {
                  // Navigate to results view
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [transcriptId])

  return { status, isLoading }
}
