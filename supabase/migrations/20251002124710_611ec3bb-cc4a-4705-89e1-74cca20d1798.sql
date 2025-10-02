-- Update gdpr_audit_log event_type constraint to include all existing and new event types
ALTER TABLE gdpr_audit_log DROP CONSTRAINT IF EXISTS gdpr_audit_log_event_type_check;

ALTER TABLE gdpr_audit_log ADD CONSTRAINT gdpr_audit_log_event_type_check 
CHECK (event_type IN (
  -- Original GDPR event types
  'data_export_requested',
  'data_export_completed',
  'data_deletion_requested',
  'data_deletion_completed',
  'consent_updated',
  'data_accessed',
  'data_modified',
  -- Existing event types found in database
  'file_upload_validated_enhanced',
  'last_login_updated',
  'transcript_deleted',
  'transcript_deletion_failed',
  'role_change',
  'role_change_failed',
  'webhook_logs_cleanup',
  'data_retention_policy_applied',
  'prompt_access',
  'admin_user_statistics_accessed',
  'file_upload_rejected_size',
  'file_upload_rejected_type',
  'file_upload_blocked_extension',
  'file_upload_suspicious_name',
  'file_upload_invalid_filename',
  'file_upload_content_threat',
  'file_upload_validated',
  'file_upload_validation_error',
  -- New event types for archive functionality
  'transcript_archived',
  'transcript_unarchived'
));