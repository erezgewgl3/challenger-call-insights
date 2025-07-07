
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityItem {
  id: string;
  type: 'user_registration' | 'transcript_upload' | 'analysis_completed' | 'system_alert' | 'user_login';
  user?: {
    email: string;
    initials: string;
  };
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export function useActivityFeed(limit: number = 10) {
  return useQuery({
    queryKey: ['activity-feed', limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      const activities: ActivityItem[] = [];

      try {
        // Get recent user registrations
        const { data: recentUsers } = await supabase
          .from('users')
          .select('id, email, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentUsers) {
          recentUsers.forEach(user => {
            const initials = user.email
              .split('@')[0]
              .split('.')
              .map(part => part.charAt(0).toUpperCase())
              .join('')
              .substring(0, 2);

            activities.push({
              id: `user-${user.id}`,
              type: 'user_registration',
              user: {
                email: user.email,
                initials
              },
              description: 'New user registered',
              timestamp: user.created_at!,
              status: 'success'
            });
          });
        }

        // Get recent transcript uploads
        const { data: recentTranscripts } = await supabase
          .from('transcripts')
          .select(`
            id, 
            title, 
            created_at, 
            status,
            users!inner(email)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentTranscripts) {
          recentTranscripts.forEach(transcript => {
            const userEmail = (transcript.users as any)?.email || 'Unknown';
            const initials = userEmail
              .split('@')[0]
              .split('.')
              .map((part: string) => part.charAt(0).toUpperCase())
              .join('')
              .substring(0, 2);

            activities.push({
              id: `transcript-${transcript.id}`,
              type: 'transcript_upload',
              user: {
                email: userEmail,
                initials
              },
              description: `Uploaded transcript "${transcript.title}"`,
              timestamp: transcript.created_at!,
              status: transcript.status === 'error' ? 'error' : 'info'
            });
          });
        }

        // Get recent analysis completions
        const { data: recentAnalyses } = await supabase
          .from('conversation_analysis')
          .select(`
            id,
            created_at,
            transcript_id,
            transcripts!inner(
              title,
              users!inner(email)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentAnalyses) {
          recentAnalyses.forEach(analysis => {
            const transcript = (analysis.transcripts as any);
            const userEmail = transcript?.users?.email || 'Unknown';
            const initials = userEmail
              .split('@')[0]
              .split('.')
              .map((part: string) => part.charAt(0).toUpperCase())
              .join('')
              .substring(0, 2);

            activities.push({
              id: `analysis-${analysis.id}`,
              type: 'analysis_completed',
              user: {
                email: userEmail,
                initials
              },
              description: 'AI analysis completed with high confidence scores',
              timestamp: analysis.created_at!,
              status: 'success'
            });
          });
        }

        // Sort all activities by timestamp (most recent first)
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return activities.slice(0, limit);
      } catch (error) {
        console.error('Error fetching activity feed:', error);
        return [];
      }
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    staleTime: 15 * 1000, // Consider data stale after 15 seconds
  });
}
