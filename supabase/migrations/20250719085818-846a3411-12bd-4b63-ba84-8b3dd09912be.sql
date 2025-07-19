
-- FINAL SECURITY REMEDIATION - Fix Last 3 Functions
-- Complete the security fix by adding SET search_path = '' to remaining functions

-- Fix get_active_prompt function (overloaded version)
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

-- Fix integration_framework_update_config function
CREATE OR REPLACE FUNCTION public.integration_framework_update_config(
  user_uuid uuid, 
  integration_type_param text, 
  config_key_param text, 
  config_value jsonb
)
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
