import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  admin_id: string | null;
  timestamp: string;
  details: Record<string, any>;
  status: string;
  legal_basis: string | null;
  created_at: string;
}

export interface SecurityMetrics {
  totalEvents24h: number;
  failedLogins24h: number;
  rateLimitViolations24h: number;
  fileUploadRejections24h: number;
  suspiciousActivity24h: number;
  criticalEvents24h: number;
}

const SECURITY_EVENT_TYPES = [
  'login_failure',
  'unauthorized_access_attempt',
  'rate_limit_exceeded',
  'file_upload_rejected_type',
  'file_upload_blocked_extension',
  'file_upload_suspicious_name',
  'file_upload_content_threat',
  'suspicious_activity'
];

export function useSecurityEvents(limit: number = 50) {
  return useQuery({
    queryKey: ['security-events', limit],
    queryFn: async (): Promise<SecurityEvent[]> => {
      const { data, error } = await supabase
        .from('gdpr_audit_log')
        .select('*')
        .in('event_type', SECURITY_EVENT_TYPES)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SecurityEvent[];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useSecurityMetrics() {
  return useQuery({
    queryKey: ['security-metrics'],
    queryFn: async (): Promise<SecurityMetrics> => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: events, error } = await supabase
        .from('gdpr_audit_log')
        .select('event_type')
        .gte('timestamp', twentyFourHoursAgo.toISOString());

      if (error) throw error;

      const metrics = {
        totalEvents24h: events?.length || 0,
        failedLogins24h: events?.filter(e => e.event_type === 'login_failure').length || 0,
        rateLimitViolations24h: events?.filter(e => e.event_type === 'rate_limit_exceeded').length || 0,
        fileUploadRejections24h: events?.filter(e => 
          e.event_type.startsWith('file_upload_rejected') || 
          e.event_type.startsWith('file_upload_blocked')
        ).length || 0,
        suspiciousActivity24h: events?.filter(e => 
          e.event_type === 'suspicious_activity' ||
          e.event_type === 'file_upload_content_threat'
        ).length || 0,
        criticalEvents24h: events?.filter(e => 
          e.event_type === 'unauthorized_access_attempt' ||
          e.event_type === 'suspicious_activity'
        ).length || 0,
      };

      return metrics;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
