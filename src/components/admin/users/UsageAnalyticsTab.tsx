
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Clock, Calendar, Target } from 'lucide-react';

interface UsageAnalyticsTabProps {
  userId: string;
}

interface UploadTrendData {
  date: string;
  uploads: number;
  analyses: number;
}

interface UsageStats {
  avgSessionDuration: number;
  peakUsageHour: number;
  mostActiveDay: string;
  successRate: number;
  totalActiveDays: number;
  engagementScore: number;
}

export function UsageAnalyticsTab({ userId }: UsageAnalyticsTabProps) {
  // Fetch usage statistics
  const { data: usageStats, isLoading: statsLoading } = useQuery({
    queryKey: ['usage-stats', userId],
    queryFn: async () => {
      const { data: transcripts } = await supabase
        .from('transcripts')
        .select('created_at, status, duration_minutes')
        .eq('user_id', userId);

      const { data: analyses } = await supabase
        .from('conversation_analysis')
        .select(`
          created_at,
          transcript:transcripts!inner(user_id)
        `)
        .eq('transcript.user_id', userId);

      const { data: user } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (!transcripts || !analyses || !user) return null;

      // Calculate statistics
      const totalDays = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const activeDays = new Set(transcripts.map(t => new Date(t.created_at).toDateString())).size;
      const successRate = transcripts.length > 0 ? (analyses.length / transcripts.length) * 100 : 0;
      const avgDuration = transcripts
        .filter(t => t.duration_minutes)
        .reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / transcripts.length || 0;

      // Peak usage hour (simplified - would need more detailed timestamp data)
      const hourCounts = transcripts.reduce((acc, t) => {
        const hour = new Date(t.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const peakHour = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '9';

      // Most active day
      const dayCounts = transcripts.reduce((acc, t) => {
        const day = new Date(t.created_at).toLocaleString('en', { weekday: 'long' });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostActiveDay = Object.entries(dayCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Monday';

      return {
        avgSessionDuration: Math.round(avgDuration),
        peakUsageHour: parseInt(peakHour),
        mostActiveDay,
        successRate: Math.round(successRate),
        totalActiveDays: activeDays,
        engagementScore: Math.round((activeDays / Math.max(totalDays, 1)) * 100)
      } as UsageStats;
    }
  });

  // Fetch upload trend data
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['upload-trend', userId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transcripts } = await supabase
        .from('transcripts')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: analyses } = await supabase
        .from('conversation_analysis')
        .select(`
          created_at,
          transcript:transcripts!inner(user_id, created_at)
        `)
        .eq('transcript.user_id', userId)
        .gte('transcript.created_at', thirtyDaysAgo.toISOString());

      if (!transcripts || !analyses) return [];

      // Group by date
      const dateGroups: Record<string, { uploads: number; analyses: number }> = {};
      
      // Initialize last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dateGroups[dateStr] = { uploads: 0, analyses: 0 };
      }

      // Count uploads
      transcripts.forEach(t => {
        const date = new Date(t.created_at).toISOString().split('T')[0];
        if (dateGroups[date]) {
          dateGroups[date].uploads++;
        }
      });

      // Count analyses
      analyses.forEach(a => {
        const date = new Date(a.created_at).toISOString().split('T')[0];
        if (dateGroups[date]) {
          dateGroups[date].analyses++;
        }
      });

      return Object.entries(dateGroups)
        .map(([date, counts]) => ({
          date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          ...counts
        }))
        .reverse(); // Show oldest to newest
    }
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (statsLoading || trendLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.avgSessionDuration || 0}m</div>
            <p className="text-xs text-muted-foreground">Per transcript</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Usage Hour</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.peakUsageHour !== undefined ? 
                `${usageStats.peakUsageHour}:00` : 
                'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">Most active time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.mostActiveDay || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Day of week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Analysis completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="uploads" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Uploads"
              />
              <Line 
                type="monotone" 
                dataKey="analyses" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Analyses"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Active Days</span>
                <span className="text-2xl font-bold">{usageStats?.totalActiveDays || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Engagement Score</span>
                <span className="text-2xl font-bold">{usageStats?.engagementScore || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${usageStats?.engagementScore || 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Based on days active since joining
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
