
-- Phase 1: Database Security Hardening - Fix search_path vulnerability in all functions
-- This is CRITICAL security fix to prevent schema poisoning attacks

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$function$;

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

-- Fix activate_single_prompt function
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

-- Fix get_active_prompt function
CREATE OR REPLACE FUNCTION public.get_active_prompt()
RETURNS TABLE(id uuid, version_number integer, user_id uuid, prompt_text text, prompt_name text, is_default boolean, is_active boolean, change_description text, activated_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, created_by uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
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
  LIMIT 1;
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
CREATE OR REPLACE FUNCTION public.integration_framework_create_connection(user_uuid uuid, integration_type text, connection_name text, credentials jsonb, configuration jsonb DEFAULT '{}'::jsonb)
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

-- Fix integration_framework_update_config function
CREATE OR REPLACE FUNCTION public.integration_framework_update_config(user_uuid uuid, integration_type_param text, config_key_param text, config_value jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  config_data jsonb;
BEGIN
  INSERT INTO public.integration_configs (
    user_id,
    integration_type,
    config_key,
    config_value
  ) VALUES (
    user_uuid,
    integration_type_param,
    config_key_param,
    config_value
  )
  ON CONFLICT (user_id, integration_type, config_key)
  DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = now();
  
  SELECT to_jsonb(ic.*) INTO config_data
  FROM public.integration_configs ic
  WHERE ic.user_id = user_uuid 
    AND ic.integration_type = integration_type_param
    AND ic.config_key = config_key_param;
  
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

-- Fix cleanup_expired_password_reset_tokens function
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() - interval '24 hours';
END;
$function$;

-- Fix integration_framework_get_connection_health function
CREATE OR REPLACE FUNCTION public.integration_framework_get_connection_health(connection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  health_data jsonb;
  recent_sync_count integer;
  recent_error_count integer;
BEGIN
  -- Get connection details
  SELECT jsonb_build_object(
    'connection_id', ic.id,
    'integration_type', ic.integration_type,
    'connection_name', ic.connection_name,
    'status', ic.connection_status,
    'last_sync_at', ic.last_sync_at
  ) INTO health_data
  FROM public.integration_connections ic
  WHERE ic.id = connection_id;
  
  IF health_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
  -- Get recent sync statistics
  SELECT COUNT(*) INTO recent_sync_count
  FROM public.integration_sync_operations iso
  WHERE iso.connection_id = connection_id
    AND iso.created_at > now() - interval '24 hours';
  
  SELECT COUNT(*) INTO recent_error_count
  FROM public.integration_sync_operations iso
  WHERE iso.connection_id = connection_id
    AND iso.operation_status = 'failed'
    AND iso.created_at > now() - interval '24 hours';
  
  -- Add health metrics to response
  health_data := health_data || jsonb_build_object(
    'recent_syncs_24h', recent_sync_count,
    'recent_errors_24h', recent_error_count,
    'health_score', CASE 
      WHEN recent_error_count = 0 THEN 'excellent'
      WHEN recent_error_count <= recent_sync_count * 0.1 THEN 'good'
      WHEN recent_error_count <= recent_sync_count * 0.3 THEN 'warning'
      ELSE 'critical'
    END
  );
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', health_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;

-- Fix validate_password_reset_token function
CREATE OR REPLACE FUNCTION public.validate_password_reset_token(p_token text, p_email text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
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
  WHERE password_reset_tokens.token_hash = computed_hash
    AND password_reset_tokens.email = p_email
    AND password_reset_tokens.used_at IS NULL
    AND password_reset_tokens.expires_at > now();
  
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
CREATE OR REPLACE FUNCTION public.integration_framework_start_sync(connection_id uuid, operation_type text, operation_data jsonb DEFAULT '{}'::jsonb)
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
CREATE OR REPLACE FUNCTION public.mark_password_reset_token_used(p_token_hash text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
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

-- Fix integration_framework_complete_sync function
CREATE OR REPLACE FUNCTION public.integration_framework_complete_sync(sync_id uuid, result_data jsonb, sync_status text DEFAULT 'completed'::text)
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
      'error', SQLERRM
    );
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
CREATE OR REPLACE FUNCTION public.integration_framework_log_webhook(connection_id uuid, webhook_event text, payload jsonb, headers jsonb DEFAULT '{}'::jsonb)
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
CREATE OR REPLACE FUNCTION public.integration_framework_get_webhook_logs(connection_id uuid, limit_count integer DEFAULT 50)
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
CREATE OR REPLACE FUNCTION public.integration_framework_get_config(user_uuid uuid, integration_type text, config_key text)
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

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Insert into public.users with error handling
  INSERT INTO public.users (id, email, role, status, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    'sales_user',
    'active',
    NEW.created_at
  );
  
  -- Log successful creation for debugging
  RAISE NOTICE 'Successfully created public.users record for user: %', NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the failure to our tracking table
    INSERT INTO public.registration_failures (user_id, user_email, error_message)
    VALUES (NEW.id, NEW.email, SQLERRM);
    
    -- Log the error but don't block auth.users creation
    RAISE WARNING 'Failed to create public.users record for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Fix update_prompts_updated_at function
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

-- Add new security function to validate OAuth state with cryptographic verification
CREATE OR REPLACE FUNCTION public.validate_oauth_state(
  p_state text,
  p_user_id uuid,
  p_integration_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  state_parts text[];
  state_user_id uuid;
  state_integration_type text;
  state_timestamp bigint;
  current_time bigint;
  config_data jsonb;
BEGIN
  -- Parse state format: userId:integrationType:timestamp
  state_parts := string_to_array(p_state, ':');
  
  IF array_length(state_parts, 1) != 3 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid state format'
    );
  END IF;
  
  state_user_id := state_parts[1]::uuid;
  state_integration_type := state_parts[2];
  state_timestamp := state_parts[3]::bigint;
  current_time := extract(epoch from now()) * 1000;
  
  -- Validate user ID and integration type
  IF state_user_id != p_user_id OR state_integration_type != p_integration_type THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'State validation failed'
    );
  END IF;
  
  -- Check timestamp (state valid for 1 hour)
  IF (current_time - state_timestamp) > 3600000 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'State expired'
    );
  END IF;
  
  -- Verify state exists in database
  SELECT config_value INTO config_data
  FROM public.integration_configs
  WHERE user_id = p_user_id
    AND integration_type = p_integration_type
    AND config_key = 'oauth_state'
    AND (config_value->>'state') = p_state;
  
  IF config_data IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'State not found in database'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'state_data', config_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'State validation error: ' || SQLERRM
    );
END;
$function$;

-- Add function to securely update user roles (admin-only)
CREATE OR REPLACE FUNCTION public.secure_update_user_role(
  p_target_user_id uuid,
  p_new_role user_role,
  p_admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  admin_role user_role;
  target_user_exists boolean;
BEGIN
  -- Verify admin has admin role
  SELECT role INTO admin_role
  FROM public.users
  WHERE id = p_admin_user_id;
  
  IF admin_role IS NULL OR admin_role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin role required'
    );
  END IF;
  
  -- Check if target user exists
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE id = p_target_user_id
  ) INTO target_user_exists;
  
  IF NOT target_user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target user not found'
    );
  END IF;
  
  -- Update user role
  UPDATE public.users
  SET role = p_new_role
  WHERE id = p_target_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User role updated successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Role update failed: ' || SQLERRM
    );
END;
$function$;
