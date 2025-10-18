import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { startOfDay, subDays, format } from 'date-fns'

export function useRealUsageData(days: number = 7) {
  return useQuery({
    queryKey: ['real-usage-data', days],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), days))
      
      // Get prompts created per day
      const { data: promptsData } = await supabase
        .from('prompts')
        .select('created_at')
        .gte('created_at', startDate.toISOString())

      // Get analyses per day
      const { data: analysesData } = await supabase
        .from('conversation_analysis')
        .select('created_at')
        .gte('created_at', startDate.toISOString())

      // Get active users per day (based on last_login)
      const { data: usersData } = await supabase
        .from('users')
        .select('last_login')
        .gte('last_login', startDate.toISOString())

      // Aggregate by day
      const dailyStats: Record<string, { prompts: number; analyses: number; users: number }> = {}
      
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd')
        dailyStats[date] = { prompts: 0, analyses: 0, users: 0 }
      }

      promptsData?.forEach(item => {
        const date = format(new Date(item.created_at), 'yyyy-MM-dd')
        if (dailyStats[date]) dailyStats[date].prompts++
      })

      analysesData?.forEach(item => {
        const date = format(new Date(item.created_at), 'yyyy-MM-dd')
        if (dailyStats[date]) dailyStats[date].analyses++
      })

      usersData?.forEach(item => {
        if (item.last_login) {
          const date = format(new Date(item.last_login), 'yyyy-MM-dd')
          if (dailyStats[date]) dailyStats[date].users++
        }
      })

      return Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        prompts: stats.prompts,
        analyses: stats.analyses,
        users: stats.users
      }))
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000
  })
}

export function useRealUsageSummary() {
  return useQuery({
    queryKey: ['real-usage-summary'],
    queryFn: async () => {
      const weekAgo = startOfDay(subDays(new Date(), 7))

      // Total prompts
      const { count: totalPrompts } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })

      // Prompts this week
      const { count: promptsThisWeek } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())

      // Total analyses
      const { count: totalAnalyses } = await supabase
        .from('conversation_analysis')
        .select('*', { count: 'exact', head: true })

      // Analyses this week
      const { count: analysesThisWeek } = await supabase
        .from('conversation_analysis')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())

      // Active users this week
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', weekAgo.toISOString())

      return {
        totalPrompts: totalPrompts || 0,
        promptsThisWeek: promptsThisWeek || 0,
        totalAnalyses: totalAnalyses || 0,
        analysesThisWeek: analysesThisWeek || 0,
        activeUsers: activeUsers || 0,
        promptGrowth: totalPrompts ? Math.round((promptsThisWeek / totalPrompts) * 100) : 0,
        analysisGrowth: totalAnalyses ? Math.round((analysesThisWeek / totalAnalyses) * 100) : 0
      }
    },
    refetchInterval: 60000,
    staleTime: 30000
  })
}
