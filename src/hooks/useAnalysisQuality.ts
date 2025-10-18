import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useAnalysisQuality() {
  const queryClient = useQueryClient()
  
  // Fetch quality flags with transcript info
  const { data: qualityFlags, isLoading } = useQuery({
    queryKey: ['analysis-quality-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_quality_flags')
        .select(`
          *,
          conversation_analysis!inner (
            id,
            transcript_id,
            transcripts!inner (
              id,
              title,
              user_id
            )
          )
        `)
        .is('resolved_at', null)
        .order('flagged_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data
    }
  })
  
  // Get aggregate stats
  const { data: stats } = useQuery({
    queryKey: ['analysis-quality-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_quality_flags')
        .select('flag_type, resolved_at')
        .gte('flagged_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      
      if (error) throw error
      
      const byType: Record<string, { total: number; unresolved: number }> = {}
      
      data.forEach(flag => {
        if (!byType[flag.flag_type]) {
          byType[flag.flag_type] = { total: 0, unresolved: 0 }
        }
        byType[flag.flag_type].total++
        if (!flag.resolved_at) {
          byType[flag.flag_type].unresolved++
        }
      })
      
      return {
        byType,
        totalIssues: data.length,
        unresolvedIssues: data.filter(f => !f.resolved_at).length
      }
    }
  })
  
  // Mark flag as resolved
  const resolveFlag = useMutation({
    mutationFn: async (flagId: string) => {
      const { data: userData } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('analysis_quality_flags')
        .update({ 
          resolved_at: new Date().toISOString(),
          resolved_by: userData.user?.id
        })
        .eq('id', flagId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-quality-flags'] })
      queryClient.invalidateQueries({ queryKey: ['analysis-quality-stats'] })
      toast.success('Quality issue marked as resolved')
    },
    onError: (error) => {
      console.error('Error resolving flag:', error)
      toast.error('Failed to resolve quality issue')
    }
  })
  
  return {
    qualityFlags,
    stats,
    isLoading,
    resolveFlag
  }
}
