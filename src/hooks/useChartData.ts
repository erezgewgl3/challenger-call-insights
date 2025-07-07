
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
}

interface TranscriptVolumeData {
  date: string;
  uploads: number;
  processed: number;
  errors: number;
}

interface AnalysisPerformanceData {
  timestamp: string;
  avgTime: number;
  p95Time: number;
  successRate: number;
}

export function useUserGrowthData(days: number = 7) {
  return useQuery({
    queryKey: ['user-growth-data', days],
    queryFn: async (): Promise<UserGrowthData[]> => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get daily user registrations
      const { data: dailyRegistrations } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      // Get total users count for each day
      const result: UserGrowthData[] = [];
      
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Count total users up to this date
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', currentDate.toISOString());
        
        // Count new users on this date
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);
        
        const { count: newUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', currentDate.toISOString())
          .lt('created_at', nextDate.toISOString());
        
        result.push({
          date: dateStr,
          totalUsers: totalUsers || 0,
          newUsers: newUsers || 0,
          activeUsers: Math.floor((totalUsers || 0) * 0.8) // Estimate based on total users
        });
      }
      
      return result;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}

export function useTranscriptVolumeData(days: number = 7) {
  return useQuery({
    queryKey: ['transcript-volume-data', days],
    queryFn: async (): Promise<TranscriptVolumeData[]> => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const result: TranscriptVolumeData[] = [];
      
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);
        
        // Get transcript counts for this day
        const { data: transcripts } = await supabase
          .from('transcripts')
          .select('status')
          .gte('created_at', currentDate.toISOString())
          .lt('created_at', nextDate.toISOString());
        
        const uploads = transcripts?.length || 0;
        const processed = transcripts?.filter(t => t.status === 'completed').length || 0;
        const errors = transcripts?.filter(t => t.status === 'error').length || 0;
        
        result.push({
          date: dateStr,
          uploads,
          processed,
          errors
        });
      }
      
      return result;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAnalysisPerformanceData(hours: number = 24) {
  return useQuery({
    queryKey: ['analysis-performance-data', hours],
    queryFn: async (): Promise<AnalysisPerformanceData[]> => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(endDate.getHours() - hours);

      // Get analysis data with timestamps
      const { data: analyses } = await supabase
        .from('conversation_analysis')
        .select('created_at, transcript_id')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      // Group by 4-hour intervals
      const result: AnalysisPerformanceData[] = [];
      const intervalHours = 4;
      const intervalCount = Math.ceil(hours / intervalHours);
      
      for (let i = 0; i < intervalCount; i++) {
        const intervalStart = new Date(startDate);
        intervalStart.setHours(startDate.getHours() + (i * intervalHours));
        
        const intervalEnd = new Date(intervalStart);
        intervalEnd.setHours(intervalStart.getHours() + intervalHours);
        
        const intervalAnalyses = analyses?.filter(a => {
          const createdAt = new Date(a.created_at!);
          return createdAt >= intervalStart && createdAt < intervalEnd;
        }) || [];
        
        // Simulate processing times (in production, you'd store actual processing times)
        const avgTime = intervalAnalyses.length > 0 ? 20 + Math.random() * 10 : 0;
        const p95Time = avgTime * 2;
        const successRate = intervalAnalyses.length > 0 ? 95 + Math.random() * 5 : 100;
        
        result.push({
          timestamp: intervalStart.toISOString(),
          avgTime: Math.round(avgTime * 10) / 10,
          p95Time: Math.round(p95Time * 10) / 10,
          successRate: Math.round(successRate * 10) / 10
        });
      }
      
      return result;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}
