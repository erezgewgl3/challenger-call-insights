-- Phase 2: Complete Security Remediation - Fix remaining critical functions (corrected)
-- Drop and recreate functions that need return type changes

-- Drop and recreate cleanup function with correct return type
DROP FUNCTION IF EXISTS public.cleanup_expired_password_reset_tokens();

CREATE FUNCTION public.cleanup_expired_password_reset_tokens()
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

-- Fix remaining functions with correct search_path protection
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

-- Fix integration functions
CREATE OR REPLACE FUNCTION public.integration_framework_complete_sync(
  sync_id uuid,
  result_data jsonb,
  sync_status text DEFAULT 'completed'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  sync_data jsonb;
BEGIN
  UPDATE public.integration_sync_operations 
  SET 
    operation_status = sync_status,
    operation_data = operation_data || result_data,
    completed_at = now(),
    progress_percentage = 100
  WHERE id = sync_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'message', 'Sync operation not found'
    );
  END IF;
  
  SELECT to_jsonb(iso.*) INTO sync_data
  FROM public.integration_sync_operations iso
  WHERE iso.id = sync_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', sync_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', 'Sync completion failed: ' || SQLERRM
    );
END;
$function$;

-- Fix prompt functions with proper validation and search_path
CREATE OR REPLACE FUNCTION public.get_active_prompt(
  p_user_id uuid DEFAULT NULL,
  p_prompt_type text DEFAULT 'default'
)
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
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Try to get user-specific prompt first
  IF p_user_id IS NOT NULL THEN
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
    WHERE p.user_id = p_user_id
      AND p.is_active = true
    ORDER BY p.created_at DESC
    LIMIT 1;
    
    -- If we found a user-specific prompt, return
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- Fall back to default prompt
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
  WHERE p.user_id IS NULL 
    AND p.is_default = true
    AND p.is_active = true
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_single_prompt(prompt_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Deactivate all prompts first
  UPDATE public.prompts SET is_active = false WHERE is_active = true;
  
  -- Activate the specified prompt
  UPDATE public.prompts 
  SET 
    is_active = true,
    activated_at = now()
  WHERE id = prompt_id_param;
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