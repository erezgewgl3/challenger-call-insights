-- Fix function search path security issues
-- Update the cleanup function with secure search_path
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete webhook logs older than 30 days
  DELETE FROM public.zapier_webhook_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  INSERT INTO public.gdpr_audit_log (
    event_type,
    user_id,
    admin_id,
    details,
    status,
    legal_basis,
    timestamp
  ) VALUES (
    'webhook_logs_cleanup',
    NULL,
    NULL,
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', 30,
      'cleanup_time', NOW()
    ),
    'completed',
    'Data retention policy',
    NOW()
  );
  
  RETURN deleted_count;
END;
$$;