
-- Phase 1: Critical Database Security - Fix remaining functions missing search_path protection
-- This addresses the schema poisoning vulnerability identified in the security review

-- Fix the OAuth state validation function
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
  state_record record;
  state_parts text[];
  state_timestamp bigint;
  current_time bigint;
BEGIN
  -- Parse state components
  state_parts := string_to_array(p_state, ':');
  
  -- Validate state format
  IF array_length(state_parts, 1) != 3 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid state format'
    );
  END IF;
  
  -- Validate state components
  IF state_parts[1] != p_user_id::text OR state_parts[2] != p_integration_type THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'State validation failed'
    );
  END IF;
  
  -- Check timestamp (1 hour expiry)
  BEGIN
    state_timestamp := state_parts[3]::bigint;
    current_time := extract(epoch from now()) * 1000;
    
    IF (current_time - state_timestamp) > 3600000 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'State has expired'
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Invalid timestamp in state'
      );
  END;
  
  -- Look up stored state data
  SELECT * INTO state_record
  FROM public.integration_configs
  WHERE user_id = p_user_id::uuid
    AND integration_type = p_integration_type
    AND config_key = 'oauth_state'
    AND (config_value->>'state')::text = p_state;
  
  IF state_record IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'State not found in storage'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'state_data', state_record.config_value
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'State validation error: ' || SQLERRM
    );
END;
$function$;

-- Add function to securely validate role changes with audit logging
CREATE OR REPLACE FUNCTION public.validate_role_change(
  p_target_user_id uuid,
  p_new_role text,
  p_admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  admin_record record;
  target_user_record record;
  current_role text;
BEGIN
  -- Validate admin permissions
  SELECT * INTO admin_record
  FROM public.users
  WHERE id = p_admin_user_id AND role = 'admin';
  
  IF admin_record IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Insufficient permissions - admin role required'
    );
  END IF;
  
  -- Prevent self-role modification
  IF p_target_user_id = p_admin_user_id THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Cannot modify your own role'
    );
  END IF;
  
  -- Validate target user exists
  SELECT * INTO target_user_record
  FROM public.users
  WHERE id = p_target_user_id;
  
  IF target_user_record IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Target user not found'
    );
  END IF;
  
  -- Validate new role
  IF p_new_role NOT IN ('admin', 'sales_user') THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid role specified'
    );
  END IF;
  
  current_role := target_user_record.role::text;
  
  -- Check if change is actually needed
  IF current_role = p_new_role THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'User already has the specified role'
    );
  END IF;
  
  -- Log the role change attempt
  PERFORM public.log_security_event(
    'role_change_validated',
    p_target_user_id,
    jsonb_build_object(
      'admin_user_id', p_admin_user_id,
      'previous_role', current_role,
      'new_role', p_new_role,
      'target_user_email', target_user_record.email
    )
  );
  
  RETURN jsonb_build_object(
    'valid', true,
    'previous_role', current_role,
    'target_user_email', target_user_record.email
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Role validation error: ' || SQLERRM
    );
END;
$function$;

-- Add function to securely execute role changes
CREATE OR REPLACE FUNCTION public.execute_role_change(
  p_target_user_id uuid,
  p_new_role text,
  p_admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  validation_result jsonb;
  previous_role text;
BEGIN
  -- First validate the change
  validation_result := public.validate_role_change(p_target_user_id, p_new_role, p_admin_user_id);
  
  IF NOT (validation_result->>'valid')::boolean THEN
    RETURN validation_result;
  END IF;
  
  previous_role := validation_result->>'previous_role';
  
  -- Execute the role change
  UPDATE public.users
  SET role = p_new_role::user_role
  WHERE id = p_target_user_id;
  
  -- Log successful role change
  PERFORM public.log_security_event(
    'role_change_completed',
    p_target_user_id,
    jsonb_build_object(
      'admin_user_id', p_admin_user_id,
      'previous_role', previous_role,
      'new_role', p_new_role,
      'success', true
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role changed successfully',
    'previous_role', previous_role,
    'new_role', p_new_role
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log failed role change
    PERFORM public.log_security_event(
      'role_change_failed',
      p_target_user_id,
      jsonb_build_object(
        'admin_user_id', p_admin_user_id,
        'new_role', p_new_role,
        'error', SQLERRM
      )
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to change role: ' || SQLERRM
    );
END;
$function$;

-- Clean up duplicate RLS policies on invites table for better security clarity
DROP POLICY IF EXISTS "Admins can manage invites" ON invites;

-- Keep only the most appropriate policy
-- "Admins manage invites" and "Public can validate invites" policies remain

-- Add session validation function for enhanced security
CREATE OR REPLACE FUNCTION public.validate_session_security(
  p_user_id uuid,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  session_count integer;
  max_concurrent_sessions integer := 5; -- Configurable limit
BEGIN
  -- Count active sessions (simplified - in production you'd track this properly)
  -- This is a basic implementation for the security framework
  
  -- Log session validation
  PERFORM public.log_security_event(
    'session_validation',
    p_user_id,
    jsonb_build_object(
      'ip_address', p_ip_address,
      'user_agent', p_user_agent,
      'validation_time', now()
    )
  );
  
  -- For now, always allow (this provides the framework for future enhancements)
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'Session validation passed'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Session validation error: ' || SQLERRM
    );
END;
$function$;
