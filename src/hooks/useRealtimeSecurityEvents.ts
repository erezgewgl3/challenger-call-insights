import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SecurityEvent } from './useSecurityEvents';

interface RealtimeSecurityOptions {
  showToasts?: boolean;
  onCriticalEvent?: (event: SecurityEvent) => void;
}

export function useRealtimeSecurityEvents(options: RealtimeSecurityOptions = {}) {
  const { showToasts = true, onCriticalEvent } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up realtime security events subscription');

    const channel = supabase
      .channel('security-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gdpr_audit_log',
          filter: 'event_type=in.(login_failure,unauthorized_access_attempt,rate_limit_exceeded,file_upload_rejected_type,file_upload_blocked_extension,file_upload_suspicious_name,file_upload_content_threat,suspicious_activity)'
        },
        (payload) => {
          console.log('New security event received:', payload);
          
          const newEvent = payload.new as SecurityEvent;
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['security-events'] });
          queryClient.invalidateQueries({ queryKey: ['security-metrics'] });
          
          // Show toast notification for critical events
          if (showToasts) {
            const isCritical = 
              newEvent.event_type === 'suspicious_activity' || 
              newEvent.event_type === 'unauthorized_access_attempt';
            
            if (isCritical) {
              toast.error('Critical Security Event Detected', {
                description: formatEventType(newEvent.event_type),
                duration: 10000,
              });
            } else {
              toast.warning('Security Event', {
                description: formatEventType(newEvent.event_type),
                duration: 5000,
              });
            }
          }
          
          // Call custom handler for critical events
          if (onCriticalEvent && isCriticalEvent(newEvent)) {
            onCriticalEvent(newEvent);
          }
        }
      )
      .subscribe((status) => {
        console.log('Security events subscription status:', status);
      });

    return () => {
      console.log('Cleaning up security events subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, showToasts, onCriticalEvent]);
}

function formatEventType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isCriticalEvent(event: SecurityEvent): boolean {
  return (
    event.event_type === 'suspicious_activity' ||
    event.event_type === 'unauthorized_access_attempt' ||
    event.event_type === 'file_upload_content_threat'
  );
}
