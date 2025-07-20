
-- Security Remediation: Remove conflicting get_active_prompt function overload
-- Keep only the simple parameterless version with enhanced security

-- Drop the conflicting parameterized version that causes PostgreSQL ambiguity
DROP FUNCTION IF EXISTS public.get_active_prompt(uuid, text);

-- Enhance the remaining function with better security and audit logging
CREATE OR REPLACE FUNCTION public.get_active_prompt()
RETURNS TABLE(
  id uuid,
  version_number integer,
  user_id uuid,
  prompt_text text,
  prompt_name text,
  is_default boolean,
  is_active boolean,
  change_description text,
  activated_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log prompt access for security monitoring
  PERFORM public.log_security_event(
    'prompt_access',
    auth.uid(),
    jsonb_build_object(
      'action', 'get_active_prompt',
      'timestamp', now(),
      'caller_context', 'system'
    )
  );
  
  -- Return the single active prompt
  RETURN QUERY
  SELECT 
    p.id,
    p.version_number,
    p.user_id,
    p.prompt_text,
    p.prompt_name,
    p.is_default,
    p.is_active,
    p.change_description,
    p.activated_at,
    p.created_at,
    p.updated_at,
    p.created_by
  FROM public.prompts p
  WHERE p.is_active = true
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$;

-- Add rate limiting function for prompt access
CREATE OR REPLACE FUNCTION public.check_prompt_access_rate_limit(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recent_access_count integer;
BEGIN
  -- Check access attempts in last minute
  SELECT COUNT(*) INTO recent_access_count
  FROM public.gdpr_audit_log
  WHERE user_id = p_user_id
    AND event_type = 'prompt_access'
    AND timestamp > now() - interval '1 minute';
  
  -- Allow up to 60 requests per minute
  RETURN recent_access_count < 60;
END;
$$;

-- Reset the stuck transcript for reprocessing
UPDATE public.transcripts 
SET status = 'uploaded', error_message = NULL, processed_at = NULL
WHERE title = 'Zoom_Poor_Sales_Call.vtt' AND status = 'error';
