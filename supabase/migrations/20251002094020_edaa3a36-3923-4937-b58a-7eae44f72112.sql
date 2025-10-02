-- Add missing transcript deletion event types to gdpr_audit_log constraint
ALTER TABLE public.gdpr_audit_log DROP CONSTRAINT IF EXISTS gdpr_audit_log_event_type_check;

-- Add comprehensive event type constraint including transcript deletion events
ALTER TABLE public.gdpr_audit_log ADD CONSTRAINT gdpr_audit_log_event_type_check 
CHECK (event_type IN (
  -- GDPR Data Subject Rights
  'data_export_requested', 'data_export_completed', 'data_deletion_requested',
  'data_deletion_completed', 'data_access_requested', 'data_rectification_requested',
  'data_portability_requested', 'consent_given', 'consent_withdrawn', 'consent_updated',
  
  -- Security Events
  'file_upload_validated', 'file_upload_validated_enhanced', 'file_upload_rejected_size',
  'file_upload_rejected_type', 'file_upload_blocked_extension', 'file_upload_suspicious_name',
  'file_upload_invalid_filename', 'file_upload_content_threat', 'file_upload_validation_error',
  
  -- Authentication & Access
  'prompt_access', 'last_login_updated', 'last_login_update_failed', 'session_validation',
  'login_attempt', 'login_success', 'login_failure', 'password_reset_requested',
  'password_reset_completed', 'api_key_generated', 'api_key_revoked',
  
  -- Role Management
  'role_change', 'role_change_success', 'role_change_failed', 'role_change_blocked',
  'role_change_completed', 'permission_granted', 'permission_revoked',
  
  -- Data Processing
  'transcript_uploaded', 'transcript_analyzed', 'data_processed', 'data_shared',
  'data_transfer_international', 'automated_decision_made',
  
  -- Transcript Management (NEW)
  'transcript_deleted', 'transcript_deletion_failed',
  
  -- System Security
  'security_event', 'breach_detected', 'breach_contained', 'suspicious_activity',
  'rate_limit_exceeded', 'unauthorized_access_attempt',
  
  -- Webhook & Integration Events
  'webhook_logs_cleanup', 'integration_connected', 'integration_disconnected',
  'api_access_granted', 'api_access_revoked',
  
  -- Audit & Compliance  
  'audit_log_accessed', 'compliance_check_performed', 'data_retention_policy_applied',
  'privacy_impact_assessment', 'dpo_notification_sent', 'supervisory_authority_notified',
  
  -- Admin user management events
  'admin_user_statistics_accessed'
));