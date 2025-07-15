import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface RegistrationFailure {
  id: string;
  user_id: string;
  user_email: string;
  error_message: string;
  attempted_at: string;
  alert_sent: boolean;
  alert_sent_at: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolution_method: string | null;
}

interface RegistrationFailuresStats {
  total: number;
  unresolved: number;
  resolved: number;
  alertsSent: number;
}

export function useRegistrationFailures() {
  return useQuery({
    queryKey: ['registration-failures'],
    queryFn: async (): Promise<RegistrationFailure[]> => {
      const { data, error } = await supabase
        .from('registration_failures')
        .select('*')
        .order('attempted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useRegistrationFailuresStats() {
  return useQuery({
    queryKey: ['registration-failures-stats'],
    queryFn: async (): Promise<RegistrationFailuresStats> => {
      const { data, error } = await supabase
        .from('registration_failures')
        .select('resolved, alert_sent');

      if (error) throw error;

      const total = data.length;
      const unresolved = data.filter(f => !f.resolved).length;
      const resolved = data.filter(f => f.resolved).length;
      const alertsSent = data.filter(f => f.alert_sent).length;

      return {
        total,
        unresolved,
        resolved,
        alertsSent
      };
    },
    refetchInterval: 30000,
  });
}

export function useFixOrphanedUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fix-orphaned-users');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-failures'] });
      queryClient.invalidateQueries({ queryKey: ['registration-failures-stats'] });
      queryClient.invalidateQueries({ queryKey: ['system-metrics'] });
    },
  });
}

export function useMarkFailureResolved() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, method }: { id: string; method: string }) => {
      const { error } = await supabase
        .from('registration_failures')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_method: method
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-failures'] });
      queryClient.invalidateQueries({ queryKey: ['registration-failures-stats'] });
    },
  });
}

export function useSendTestAlert() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('monitor-registration-failures', {
        body: { test: true }
      });
      if (error) throw error;
      return data;
    },
  });
}