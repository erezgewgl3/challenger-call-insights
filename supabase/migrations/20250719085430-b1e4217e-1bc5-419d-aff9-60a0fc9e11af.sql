
-- PHASE 1: COMPLETE SECURITY REMEDIATION - All Remaining Functions
-- Fix all functions missing SET search_path = '' protection

-- Fix mark_users_pending_deletion function
CREATE OR REPLACE FUNCTION public.mark_users_pending_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Update users status to pending_deletion if they have active deletion requests
  UPDATE public.users 
  SET status = 'pending_deletion'
  WHERE id IN (
    SELECT DISTINCT user_id 
    FROM public.deletion_requests 
    WHERE status = 'pending' 
    AND scheduled_for > now()
  )
  AND status = 'active';
END;
$function$;

-- Fix fix_orphaned_auth_users function
CREATE OR REPLACE FUNCTION public.fix_orphaned_auth_users()
RETURNS TABLE(fixed_user_id uuid, fixed_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  INSERT INTO public.users (id, email, role, status, created_at)
  SELECT 
    au.id,
    au.email,
    'sales_user'::user_role,
    'active'::user_status,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL
    AND au.email IS NOT NULL
    AND au.email_confirmed_at IS NOT NULL
  RETURNING id, email;
END;
$function$;

-- Fix integration_framework_get_connection function
CREATE OR REPLACE FUNCTION public.integration_framework_get_connection(user_uuid uuid, integration_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  connection_data jsonb;
BEGIN
  SELECT to_jsonb(ic.*) INTO connection_data
  FROM public.integration_connections ic
  WHERE ic.user_id = user_uuid 
    AND ic.integration_type = integration_type
    AND ic.connection_status = 'active';
  
  IF connection_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', connection_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_create_connection function
CREATE OR REPLACE FUNCTION public.integration_framework_create_connection(
  user_uuid uuid, 
  integration_type text, 
  connection_name text, 
  credentials jsonb, 
  configuration jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  new_connection_id uuid;
  connection_data jsonb;
BEGIN
  INSERT INTO public.integration_connections (
    user_id,
    integration_type,
    connection_name,
    credentials,
    configuration,
    connection_status
  ) VALUES (
    user_uuid,
    integration_type,
    connection_name,
    credentials,
    configuration,
    'active'
  ) RETURNING id INTO new_connection_id;
  
  SELECT to_jsonb(ic.*) INTO connection_data
  FROM public.integration_connections ic
  WHERE ic.id = new_connection_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', connection_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_update_connection function
CREATE OR REPLACE FUNCTION public.integration_framework_update_connection(connection_id uuid, updates jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  connection_data jsonb;
BEGIN
  UPDATE public.integration_connections 
  SET 
    connection_name = COALESCE((updates->>'connection_name')::text, connection_name),
    credentials = COALESCE((updates->'credentials')::jsonb, credentials),
    configuration = COALESCE((updates->'configuration')::jsonb, configuration),
    connection_status = COALESCE((updates->>'connection_status')::text, connection_status),
    last_sync_at = COALESCE((updates->>'last_sync_at')::timestamptz, last_sync_at),
    updated_at = now()
  WHERE id = connection_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
  SELECT to_jsonb(ic.*) INTO connection_data
  FROM public.integration_connections ic
  WHERE ic.id = connection_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', connection_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_delete_connection function
CREATE OR REPLACE FUNCTION public.integration_framework_delete_connection(connection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.integration_connections 
  SET connection_status = 'disconnected', updated_at = now()
  WHERE id = connection_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'message', 'Connection not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Connection disconnected successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_get_connection_status function
CREATE OR REPLACE FUNCTION public.integration_framework_get_connection_status(user_uuid uuid, integration_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  status_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'integration_type', ic.integration_type,
    'connection_name', ic.connection_name,
    'status', ic.connection_status,
    'last_sync_at', ic.last_sync_at,
    'created_at', ic.created_at,
    'updated_at', ic.updated_at
  ) INTO status_data
  FROM public.integration_connections ic
  WHERE ic.user_id = user_uuid 
    AND ic.integration_type = integration_type;
  
  IF status_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', status_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_update_connection_status function
CREATE OR REPLACE FUNCTION public.integration_framework_update_connection_status(connection_id uuid, new_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.integration_connections 
  SET connection_status = new_status, updated_at = now()
  WHERE id = connection_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'message', 'Connection not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Connection status updated successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_start_sync function
CREATE OR REPLACE FUNCTION public.integration_framework_start_sync(
  connection_id uuid, 
  operation_type text, 
  operation_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  sync_id uuid;
  sync_data jsonb;
BEGIN
  INSERT INTO public.integration_sync_operations (
    connection_id,
    operation_type,
    operation_data,
    operation_status,
    started_at
  ) VALUES (
    connection_id,
    operation_type,
    operation_data,
    'running',
    now()
  ) RETURNING id INTO sync_id;
  
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
      'error', SQLERRM
    );
END;
$function$;

-- Fix mark_password_reset_token_used function
CREATE OR REPLACE FUNCTION public.mark_password_reset_token_used(
  p_token_hash text, 
  p_ip_address text DEFAULT NULL, 
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.password_reset_tokens
  SET used_at = now(),
      ip_address = COALESCE(p_ip_address, ip_address),
      user_agent = COALESCE(p_user_agent, user_agent)
  WHERE token_hash = p_token_hash;
END;
$function$;

-- Fix integration_framework_get_sync_status function
CREATE OR REPLACE FUNCTION public.integration_framework_get_sync_status(sync_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  sync_data jsonb;
BEGIN
  SELECT to_jsonb(iso.*) INTO sync_data
  FROM public.integration_sync_operations iso
  WHERE iso.id = sync_id;
  
  IF sync_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', sync_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_log_webhook function
CREATE OR REPLACE FUNCTION public.integration_framework_log_webhook(
  connection_id uuid, 
  webhook_event text, 
  payload jsonb, 
  headers jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  log_id uuid;
  log_data jsonb;
BEGIN
  INSERT INTO public.integration_webhook_logs (
    connection_id,
    webhook_event,
    payload,
    headers,
    processing_status
  ) VALUES (
    connection_id,
    webhook_event,
    payload,
    headers,
    'pending'
  ) RETURNING id INTO log_id;
  
  SELECT to_jsonb(iwl.*) INTO log_data
  FROM public.integration_webhook_logs iwl
  WHERE iwl.id = log_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', log_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_get_webhook_logs function
CREATE OR REPLACE FUNCTION public.integration_framework_get_webhook_logs(
  connection_id uuid, 
  limit_count integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  logs_data jsonb;
BEGIN
  SELECT jsonb_agg(to_jsonb(iwl.*) ORDER BY iwl.created_at DESC) INTO logs_data
  FROM public.integration_webhook_logs iwl
  WHERE iwl.connection_id = connection_id
  LIMIT limit_count;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', COALESCE(logs_data, '[]'::jsonb)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_get_config function
CREATE OR REPLACE FUNCTION public.integration_framework_get_config(
  user_uuid uuid, 
  integration_type text, 
  config_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  config_data jsonb;
BEGIN
  SELECT ic.config_value INTO config_data
  FROM public.integration_configs ic
  WHERE ic.user_id = user_uuid 
    AND ic.integration_type = integration_type
    AND ic.config_key = config_key;
  
  IF config_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', config_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_get_user_stats function
CREATE OR REPLACE FUNCTION public.integration_framework_get_user_stats(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  stats_data jsonb;
  connection_count integer;
  active_sync_count integer;
  total_sync_count integer;
  error_rate numeric;
BEGIN
  -- Get connection statistics
  SELECT COUNT(*) INTO connection_count
  FROM public.integration_connections ic
  WHERE ic.user_id = user_uuid AND ic.connection_status = 'active';
  
  -- Get sync statistics
  SELECT COUNT(*) INTO active_sync_count
  FROM public.integration_sync_operations iso
  JOIN public.integration_connections ic ON iso.connection_id = ic.id
  WHERE ic.user_id = user_uuid AND iso.operation_status = 'running';
  
  SELECT COUNT(*) INTO total_sync_count
  FROM public.integration_sync_operations iso
  JOIN public.integration_connections ic ON iso.connection_id = ic.id
  WHERE ic.user_id = user_uuid AND iso.created_at > now() - interval '30 days';
  
  -- Calculate error rate
  SELECT 
    CASE 
      WHEN total_sync_count = 0 THEN 0
      ELSE ROUND(
        (COUNT(CASE WHEN iso.operation_status = 'failed' THEN 1 END)::numeric / total_sync_count) * 100, 2
      )
    END INTO error_rate
  FROM public.integration_sync_operations iso
  JOIN public.integration_connections ic ON iso.connection_id = ic.id
  WHERE ic.user_id = user_uuid AND iso.created_at > now() - interval '30 days';
  
  stats_data := jsonb_build_object(
    'active_connections', connection_count,
    'active_syncs', active_sync_count,
    'total_syncs_30d', total_sync_count,
    'error_rate_30d', COALESCE(error_rate, 0),
    'last_updated', now()
  );
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', stats_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix integration_framework_get_system_stats function
CREATE OR REPLACE FUNCTION public.integration_framework_get_system_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  stats_data jsonb;
  total_connections integer;
  total_users integer;
  total_syncs_today integer;
  total_webhooks_today integer;
BEGIN
  -- Get system-wide statistics
  SELECT COUNT(*) INTO total_connections
  FROM public.integration_connections
  WHERE connection_status = 'active';
  
  SELECT COUNT(DISTINCT user_id) INTO total_users
  FROM public.integration_connections;
  
  SELECT COUNT(*) INTO total_syncs_today
  FROM public.integration_sync_operations
  WHERE created_at > current_date;
  
  SELECT COUNT(*) INTO total_webhooks_today
  FROM public.integration_webhook_logs
  WHERE created_at > current_date;
  
  stats_data := jsonb_build_object(
    'total_active_connections', total_connections,
    'total_users_with_integrations', total_users,
    'total_syncs_today', total_syncs_today,
    'total_webhooks_today', total_webhooks_today,
    'last_updated', now()
  );
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', stats_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix validate_file_upload function
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  p_file_name text, 
  p_file_size bigint, 
  p_content_type text, 
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  allowed_types text[] := ARRAY['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/vtt'];
  max_size_bytes bigint := 10485760; -- 10MB
BEGIN
  -- File size validation
  IF p_file_size > max_size_bytes THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'File size exceeds 10MB limit'
    );
  END IF;
  
  -- Content type validation
  IF NOT (p_content_type = ANY(allowed_types)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid file type. Only .txt, .docx, and .vtt files are allowed'
    );
  END IF;
  
  -- File name validation (prevent path traversal)
  IF p_file_name ~* '\.\.|[<>:"|?*]|^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid file name'
    );
  END IF;
  
  -- Log successful validation
  PERFORM public.log_security_event(
    'file_upload_validated',
    p_user_id,
    jsonb_build_object(
      'file_name', p_file_name,
      'file_size', p_file_size,
      'content_type', p_content_type
    )
  );
  
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'File validation passed'
  );
END;
$function$;

-- Fix update_prompts_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_prompts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix validate_password_reset_token function (already mostly secure but ensuring consistency)
CREATE OR REPLACE FUNCTION public.validate_password_reset_token(
  p_token text, 
  p_email text, 
  p_ip_address text DEFAULT NULL, 
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  reset_record record;
  computed_hash text;
BEGIN
  -- Hash the provided token
  computed_hash := public.hash_token(p_token);
  
  -- Find the reset token record
  SELECT * INTO reset_record
  FROM public.password_reset_tokens
  WHERE token_hash = computed_hash
    AND email = p_email
    AND used_at IS NULL
    AND expires_at > now();
  
  -- If no valid token found
  IF reset_record IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid or expired reset token'
    );
  END IF;
  
  -- Rate limiting check
  IF reset_record.attempts >= 5 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Too many validation attempts. Please request a new reset link.'
    );
  END IF;
  
  -- Return valid result WITHOUT marking as used
  RETURN jsonb_build_object(
    'valid', true,
    'reset_id', reset_record.id,
    'email', reset_record.email,
    'token_hash', computed_hash
  );
END;
$function$;
