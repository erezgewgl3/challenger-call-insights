-- Update execute_role_change to work with the new user_roles table
CREATE OR REPLACE FUNCTION public.execute_role_change(p_target_user_id uuid, p_new_role text, p_admin_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_admin_role text;
  target_user_record record;
  previous_role text;
BEGIN
  -- Validate input role
  IF p_new_role NOT IN ('admin', 'sales_user') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role. Must be admin or sales_user'
    );
  END IF;
  
  -- Validate that the requesting user is an admin
  IF NOT public.has_role(p_admin_user_id, 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only administrators can change user roles'
    );
  END IF;
  
  -- Prevent self-demotion (admin cannot demote themselves)
  IF p_admin_user_id = p_target_user_id AND p_new_role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Administrators cannot demote themselves'
    );
  END IF;
  
  -- Get current user information
  SELECT * INTO target_user_record
  FROM public.users
  WHERE id = p_target_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target user not found'
    );
  END IF;
  
  -- Get current role from user_roles table
  SELECT role::text INTO previous_role
  FROM public.user_roles
  WHERE user_id = p_target_user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'sales_user' THEN 2
      ELSE 3
    END
  LIMIT 1;
  
  previous_role := COALESCE(previous_role, 'sales_user');
  
  -- Prevent unnecessary role changes
  IF previous_role = p_new_role THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User already has the requested role'
    );
  END IF;
  
  -- Delete old role(s) and insert new role
  DELETE FROM public.user_roles WHERE user_id = p_target_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_target_user_id, p_new_role::user_role);
  
  -- Also update the users table for backward compatibility
  UPDATE public.users
  SET role = p_new_role::user_role
  WHERE id = p_target_user_id;
  
  -- Log the role change for audit purposes
  INSERT INTO public.gdpr_audit_log (
    event_type,
    user_id,
    admin_id,
    details,
    status,
    legal_basis,
    timestamp
  ) VALUES (
    'role_change',
    p_target_user_id,
    p_admin_user_id,
    jsonb_build_object(
      'previous_role', previous_role,
      'new_role', p_new_role,
      'target_user_email', target_user_record.email,
      'change_timestamp', now()
    ),
    'completed',
    'Administrative action',
    now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('User role changed from %s to %s', previous_role, p_new_role),
    'previous_role', previous_role,
    'new_role', p_new_role
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the failed attempt
    INSERT INTO public.gdpr_audit_log (
      event_type,
      user_id,
      admin_id,
      details,
      status,
      legal_basis,
      timestamp
    ) VALUES (
      'role_change_failed',
      p_target_user_id,
      p_admin_user_id,
      jsonb_build_object(
        'error', SQLERRM,
        'attempted_role', p_new_role,
        'failure_timestamp', now()
      ),
      'failed',
      'Administrative action',
      now()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Role change failed: ' || SQLERRM
    );
END;
$$;

-- Update handle_new_user trigger to also create user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Also insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'sales_user');
  
  -- Log successful creation for debugging
  RAISE NOTICE 'Successfully created public.users and user_roles records for user: %', NEW.email;
  
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
$$;