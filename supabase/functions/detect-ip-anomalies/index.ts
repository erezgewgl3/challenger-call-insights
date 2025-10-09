import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IPAnomalyCheck {
  ipAddress: string;
  eventType: string;
  userId?: string;
}

interface AnomalyResult {
  isAnomalous: boolean;
  reason?: string;
  eventCount: number;
  timeWindow: string;
  recommendation: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { ipAddress, eventType, userId }: IPAnomalyCheck = await req.json();

    console.log('Checking IP anomaly:', { ipAddress, eventType, userId });

    // Time windows to check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // Get recent events from this IP
    const { data: recentEvents, error: eventsError } = await supabase
      .from('gdpr_audit_log')
      .select('event_type, timestamp, user_id, details')
      .gte('timestamp', oneHourAgo)
      .order('timestamp', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    // Filter events from this IP
    const ipEvents = recentEvents?.filter(
      e => e.details?.ip_address === ipAddress
    ) || [];

    const ipEventsLast15Min = ipEvents.filter(
      e => e.timestamp >= fifteenMinutesAgo
    );

    // Anomaly detection rules
    let isAnomalous = false;
    let reason = '';
    let recommendation = 'No action required';

    // Rule 1: Too many failed logins from single IP
    const failedLogins = ipEvents.filter(e => e.event_type === 'login_failure');
    if (failedLogins.length >= 10) {
      isAnomalous = true;
      reason = `${failedLogins.length} failed login attempts from this IP in the last hour`;
      recommendation = 'Consider blocking this IP address';
    }

    // Rule 2: Multiple different users from same IP in short time
    const uniqueUsers = new Set(ipEvents.filter(e => e.user_id).map(e => e.user_id));
    if (uniqueUsers.size >= 5) {
      isAnomalous = true;
      reason = `${uniqueUsers.size} different user accounts accessed from this IP`;
      recommendation = 'Potential account sharing or credential stuffing - investigate immediately';
    }

    // Rule 3: Rapid fire requests (rate limit violations)
    const rateLimitViolations = ipEventsLast15Min.filter(
      e => e.event_type === 'rate_limit_exceeded'
    );
    if (rateLimitViolations.length >= 5) {
      isAnomalous = true;
      reason = `${rateLimitViolations.length} rate limit violations in 15 minutes`;
      recommendation = 'Potential bot or scraping activity - temporary IP ban recommended';
    }

    // Rule 4: Multiple malicious file uploads
    const maliciousUploads = ipEvents.filter(
      e => e.event_type.includes('file_upload_blocked') || 
           e.event_type.includes('file_upload_content_threat')
    );
    if (maliciousUploads.length >= 3) {
      isAnomalous = true;
      reason = `${maliciousUploads.length} malicious file upload attempts`;
      recommendation = 'Critical: Block IP and investigate user account immediately';
    }

    // Rule 5: Geographic anomaly (multiple locations - would require GeoIP service)
    // This is a placeholder for future implementation

    const result: AnomalyResult = {
      isAnomalous,
      reason,
      eventCount: ipEvents.length,
      timeWindow: 'Last 60 minutes',
      recommendation
    };

    // If anomalous, log it as suspicious activity
    if (isAnomalous) {
      console.log('IP anomaly detected:', result);
      
      await supabase.from('gdpr_audit_log').insert({
        event_type: 'suspicious_activity',
        user_id: userId || null,
        details: {
          ip_address: ipAddress,
          anomaly_reason: reason,
          event_count: ipEvents.length,
          recommendation,
          detected_at: new Date().toISOString()
        },
        status: 'completed',
        legal_basis: 'Security monitoring',
        timestamp: new Date().toISOString()
      });

      // Trigger security alert email for critical anomalies
      if (maliciousUploads.length >= 3 || uniqueUsers.size >= 5) {
        await supabase.functions.invoke('send-security-alert', {
          body: {
            eventType: 'ip_anomaly_detected',
            severity: 'critical',
            details: {
              ip_address: ipAddress,
              reason,
              event_count: ipEvents.length,
              recommendation
            },
            timestamp: new Date().toISOString(),
            userId,
            ipAddress
          }
        });
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error detecting IP anomalies:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      isAnomalous: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
