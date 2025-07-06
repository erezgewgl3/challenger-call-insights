import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TranscriptSummary {
  id: string
  title: string
  participants: string[]
  duration_minutes: number
  created_at: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
  account_name?: string
  challenger_scores?: {
    teaching: number
    tailoring: number
    control: number
  }
  conversation_analysis?: any[]
  analysis_created_at?: string
}

interface DashboardStats {
  totalTranscripts: number
}

export function useTranscriptData() {
  const [transcripts, setTranscripts] = useState<TranscriptSummary[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalTranscripts: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch ALL transcripts with analysis data (no limit) for heat deal sections
        const { data: transcriptsData, error: transcriptsError } = await supabase
          .from('transcripts')
          .select(`
            id,
            title,
            participants,
            duration_minutes,
            created_at,
            status,
            accounts(name),
            conversation_analysis(challenger_scores, recommendations, guidance, call_summary, heat_level, created_at)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (transcriptsError) throw transcriptsError

        // Debug logging to verify data structure
        console.log('🔍 DEBUG: Raw transcripts data:', transcriptsData)
        console.log('🔍 DEBUG: First transcript analysis:', transcriptsData?.[0]?.conversation_analysis)

        const formattedTranscripts: TranscriptSummary[] = transcriptsData.map(t => ({
          id: t.id,
          title: t.title,
          participants: Array.isArray(t.participants) ? t.participants as string[] : [],
          duration_minutes: t.duration_minutes || 0,
          created_at: t.created_at,
          status: t.status,
          account_name: (t.accounts as any)?.name,
          challenger_scores: (t.conversation_analysis as any)?.[0]?.challenger_scores as {
            teaching: number
            tailoring: number
            control: number
          } | undefined,
          conversation_analysis: t.conversation_analysis as any[],
          analysis_created_at: (t.conversation_analysis as any)?.[0]?.created_at
        }))

        // Debug logging for heat level analysis
        const completedWithAnalysis = formattedTranscripts.filter(t => 
          t.status === 'completed' && t.conversation_analysis?.length > 0
        )
        console.log('🔍 DEBUG: Completed transcripts with analysis:', completedWithAnalysis.length)
        
        completedWithAnalysis.forEach((transcript, index) => {
          const analysis = transcript.conversation_analysis?.[0]
          console.log(`🔍 DEBUG: Transcript ${index + 1} (${transcript.title}):`, {
            heat_level: analysis?.heat_level,
            hasRecommendations: !!analysis?.recommendations,
            hasGuidance: !!analysis?.guidance,
            hasCallSummary: !!analysis?.call_summary,
            analysis_created_at: transcript.analysis_created_at,
            fullAnalysis: analysis
          })
        })

        setTranscripts(formattedTranscripts)

        // Only keep totalTranscripts stat (the only one being used)
        setStats({
          totalTranscripts: transcriptsData.length
        })

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up real-time updates
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transcripts'
        },
        () => {
          fetchData() // Refetch data when transcripts change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { transcripts, stats, isLoading }
}
