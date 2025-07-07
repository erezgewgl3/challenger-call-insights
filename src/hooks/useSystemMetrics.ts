
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SystemMetrics {
  totalUsers: number;
  newUsersThisWeek: number;
  userGrowthTrend: 'up' | 'down' | 'neutral';
  activePrompts: number;
  analysesToday: number;
  analysesThisMonth: number;
  analysesTrend: 'up' | 'down' | 'neutral';
  uptime: number;
  systemStatus: 'healthy' | 'warning' | 'error';
}

export function useSystemMetrics() {
  return useQuery({
    queryKey: ['system-metrics'],
    queryFn: async (): Promise<SystemMetrics> => {
      try {
        // Get total users
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // Get new users this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { count: newUsersThisWeek } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString());

        // Get new users last week for trend comparison
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        const { count: newUsersLastWeek } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', weekAgo.toISOString());

        // Calculate user growth trend
        const userGrowthTrend = newUsersThisWeek && newUsersLastWeek
          ? newUsersThisWeek > newUsersLastWeek ? 'up' : 
            newUsersThisWeek < newUsersLastWeek ? 'down' : 'neutral'
          : 'neutral';

        // Get active prompts
        const { count: activePrompts } = await supabase
          .from('prompts')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Get analyses today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: analysesToday } = await supabase
          .from('conversation_analysis')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());

        // Get analyses this month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const { count: analysesThisMonth } = await supabase
          .from('conversation_analysis')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString());

        // Get analyses last month for trend
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        
        const { count: analysesLastMonth } = await supabase
          .from('conversation_analysis')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString());

        // Calculate analyses trend
        const analysesTrend = analysesThisMonth && analysesLastMonth
          ? analysesThisMonth > analysesLastMonth ? 'up' : 
            analysesThisMonth < analysesLastMonth ? 'down' : 'neutral'
          : 'neutral';

        return {
          totalUsers: totalUsers || 0,
          newUsersThisWeek: newUsersThisWeek || 0,
          userGrowthTrend,
          activePrompts: activePrompts || 0,
          analysesToday: analysesToday || 0,
          analysesThisMonth: analysesThisMonth || 0,
          analysesTrend,
          uptime: 99.9, // This would come from monitoring service in production
          systemStatus: 'healthy' as const
        };
      } catch (error) {
        console.error('Error fetching system metrics:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });
}
