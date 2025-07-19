-- Phase 2: Complete Security Remediation - Fix remaining critical functions
-- This addresses ALL remaining functions missing SET search_path protection

-- Fix auth-related functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_role text;
BEGIN
  SELECT role::text INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'anonymous');
END;
$function$;

CREATE OR REPLACE FUNCTION public.hash_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN encode(digest(token, 'sha256'), 'hex');
END;
$function$;

-- Fix integration-related functions  
CREATE OR REPLACE FUNCTION public.integration_framework_complete_sync(
  p_user_id uuid,
  p_integration_type text,
  p_sync_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  integration_record record;
BEGIN
  -- Validate user owns this integration
  SELECT * INTO integration_record
  FROM public.integration_connections
  WHERE user_id = p_user_id AND integration_type = p_integration_type;
  
  IF integration_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Integration not found'
    );
  END IF;
  
  -- Update sync status
  UPDATE public.integration_connections
  SET 
    last_sync_at = now(),
    sync_status = 'completed',
    metadata = COALESCE(metadata, '{}'::jsonb) || p_sync_data
  WHERE user_id = p_user_id AND integration_type = p_integration_type;
  
  RETURN jsonb_build_object(
    'success', true,
    'sync_completed_at', now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Sync completion failed: ' || SQLERRM
    );
END;
$function$;

-- Fix prompt management functions
CREATE OR REPLACE FUNCTION public.get_active_prompt(
  p_user_id uuid DEFAULT NULL,
  p_prompt_type text DEFAULT 'default'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  prompt_record record;
BEGIN
  -- Try to get user-specific prompt first
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO prompt_record
    FROM public.prompts
    WHERE user_id = p_user_id 
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- Fall back to default prompt if no user-specific prompt found
  IF prompt_record IS NULL THEN
    SELECT * INTO prompt_record
    FROM public.prompts
    WHERE user_id IS NULL 
      AND is_default = true
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  IF prompt_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active prompt found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'prompt', row_to_json(prompt_record)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_single_prompt(
  p_prompt_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  prompt_record record;
BEGIN
  -- Validate prompt ownership (user-specific) or admin access for defaults
  SELECT * INTO prompt_record
  FROM public.prompts
  WHERE id = p_prompt_id;
  
  IF prompt_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prompt not found'
    );
  END IF;
  
  -- Check permissions
  IF prompt_record.user_id IS NOT NULL AND prompt_record.user_id != p_user_id THEN
    -- Check if user is admin for cross-user access
    IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = p_user_id AND role = 'admin'
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient permissions'
      );
    END IF;
  END IF;
  
  -- Deactivate other prompts for this user/scope
  UPDATE public.prompts
  SET is_active = false
  WHERE (user_id = p_user_id OR (user_id IS NULL AND prompt_record.user_id IS NULL))
    AND id != p_prompt_id;
  
  -- Activate the selected prompt
  UPDATE public.prompts
  SET is_active = true
  WHERE id = p_prompt_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'activated_prompt_id', p_prompt_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Activation failed: ' || SQLERRM
    );
END;
$function$;

-- Fix monitoring functions
CREATE OR REPLACE FUNCTION public.get_user_activity_stats(
  p_user_id uuid,
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  stats jsonb;
  transcript_count integer;
  analysis_count integer;
  account_count integer;
BEGIN
  -- Count transcripts in period
  SELECT COUNT(*) INTO transcript_count
  FROM public.transcripts
  WHERE user_id = p_user_id
    AND created_at >= now() - (p_days || ' days')::interval;
  
  -- Count analyses in period
  SELECT COUNT(*) INTO analysis_count
  FROM public.conversation_analysis ca
  JOIN public.transcripts t ON ca.transcript_id = t.id
  WHERE t.user_id = p_user_id
    AND ca.created_at >= now() - (p_days || ' days')::interval;
  
  -- Count total accounts
  SELECT COUNT(*) INTO account_count
  FROM public.accounts
  WHERE user_id = p_user_id;
  
  stats := jsonb_build_object(
    'transcript_count', transcript_count,
    'analysis_count', analysis_count,
    'account_count', account_count,
    'period_days', p_days,
    'generated_at', now()
  );
  
  RETURN stats;
END;
$function$;

-- Fix cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_tokens()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.password_reset_tokens
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_tokens', deleted_count,
    'cleanup_time', now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cleanup failed: ' || SQLERRM
    );
END;
$function$;

-- Add enhanced file validation with security logging
CREATE OR REPLACE FUNCTION public.enhanced_file_validation(
  p_file_name text,
  p_file_size bigint,
  p_content_type text,
  p_user_id uuid,
  p_ip_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  max_file_size bigint := 10485760; -- 10MB
  allowed_types text[] := ARRAY['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/vtt'];
  blocked_extensions text[] := ARRAY['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.sys', '.dll'];
  file_ext text;
BEGIN
  -- Extract file extension
  file_ext := lower(substring(p_file_name from '(\.[^.]+)$'));
  
  -- Check file size
  IF p_file_size > max_file_size THEN
    PERFORM public.log_security_event(
      'file_upload_rejected_size',
      p_user_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'file_size', p_file_size,
        'max_allowed', max_file_size,
        'ip_address', p_ip_address
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'File size exceeds 10MB limit'
    );
  END IF;
  
  -- Check content type
  IF NOT (p_content_type = ANY(allowed_types)) THEN
    PERFORM public.log_security_event(
      'file_upload_rejected_type',
      p_user_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'content_type', p_content_type,
        'allowed_types', allowed_types,
        'ip_address', p_ip_address
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Unsupported file type. Only .txt, .docx, and .vtt files are allowed'
    );
  END IF;
  
  -- Check for dangerous file extensions
  IF file_ext = ANY(blocked_extensions) THEN
    PERFORM public.log_security_event(
      'file_upload_blocked_extension',
      p_user_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'blocked_extension', file_ext,
        'ip_address', p_ip_address
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'File extension not allowed for security reasons'
    );
  END IF;
  
  -- Log successful validation
  PERFORM public.log_security_event(
    'file_upload_validated',
    p_user_id,
    jsonb_build_object(
      'file_name', p_file_name,
      'file_size', p_file_size,
      'content_type', p_content_type,
      'ip_address', p_ip_address
    )
  );
  
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'File validation passed'
  );
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_security_event(
      'file_upload_validation_error',
      p_user_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'error', SQLERRM,
        'ip_address', p_ip_address
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'File validation failed: ' || SQLERRM
    );
END;
$function$;