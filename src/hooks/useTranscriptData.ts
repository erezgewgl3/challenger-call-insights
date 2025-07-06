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
}

interface DashboardStats {
  totalTranscripts: number
  completedTranscripts: number
  averageTeachingScore: number
  averageCallDuration: number
  activeDeals: number
}

export function useTranscriptData() {
  const [transcripts, setTranscripts] = useState<TranscriptSummary[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalTranscripts: 0,
    completedTranscripts: 0,
    averageTeachingScore: 0,
    averageCallDuration: 0,
    activeDeals: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch recent transcripts with analysis data including full conversation_analysis
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
            conversation_analysis(challenger_scores, recommendations, guidance, call_summary)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (transcriptsError) throw transcriptsError

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
          conversation_analysis: t.conversation_analysis as any[]
        }))

        setTranscripts(formattedTranscripts)

        // Calculate stats - keep existing logic the same
        const completed = formattedTranscripts.filter(t => t.status === 'completed')
        const totalDuration = formattedTranscripts.reduce((sum, t) => sum + t.duration_minutes, 0)
        const teachingScores = completed
          .filter(t => t.challenger_scores?.teaching)
          .map(t => t.challenger_scores!.teaching)

        setStats({
          totalTranscripts: transcriptsData.length,
          completedTranscripts: completed.length,
          averageTeachingScore: teachingScores.length > 0 
            ? teachingScores.reduce((sum, score) => sum + score, 0) / teachingScores.length 
            : 0,
          averageCallDuration: transcriptsData.length > 0 
            ? Math.round(totalDuration / transcriptsData.length) 
            : 0,
          activeDeals: new Set(formattedTranscripts.map(t => t.account_name).filter(Boolean)).size
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
