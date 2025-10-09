-- Migration: Add Security Dashboard Performance Indexes
-- Purpose: Optimize queries for security event monitoring dashboard

-- Add index for security-specific event types
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_security_events 
ON public.gdpr_audit_log(event_type, timestamp DESC) 
WHERE event_type IN (
  'login_failure', 
  'unauthorized_access_attempt',
  'rate_limit_exceeded', 
  'file_upload_rejected_type',
  'file_upload_blocked_extension',
  'file_upload_suspicious_name',
  'file_upload_content_threat',
  'suspicious_activity'
);

-- Add index for status-based queries
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_status 
ON public.gdpr_audit_log(status, timestamp DESC);

-- Add index for user-based security event queries
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_user_events
ON public.gdpr_audit_log(user_id, event_type, timestamp DESC)
WHERE user_id IS NOT NULL;

-- Set replica identity for realtime updates
ALTER TABLE public.gdpr_audit_log REPLICA IDENTITY FULL;