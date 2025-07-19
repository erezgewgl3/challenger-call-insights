-- CRITICAL SECURITY FIX - Privilege Escalation Prevention
-- Fix the privilege escalation vulnerability where users can change their own roles

-- Step 1: Remove the dangerous policy that allows users to update their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Step 2: Create a restricted policy that prevents role changes by regular users
CREATE POLICY "Users can update own profile (excluding role)" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent users from changing their own role or status
  OLD.role = NEW.role AND 
  OLD.status = NEW.status
);

-- Step 3: Create the secure role change function that adminService.ts expects
CREATE OR REPLACE FUNCTION public.execute_role_change(
  p_target_user_id uuid,
  p_new_role user_role,
  p_admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_admin_role user_role;
  target_user_record record;
  previous_role user_role;
BEGIN
  -- Validate that the requesting user is an admin
  SELECT role INTO current_admin_role
  FROM public.users
  WHERE id = p_admin_user_id;
  
  IF current_admin_role != 'admin' THEN
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
  
  previous_role := target_user_record.role;
  
  -- Prevent unnecessary role changes
  IF previous_role = p_new_role THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User already has the requested role'
    );
  END IF;
  
  -- Perform the role change
  UPDATE public.users
  SET role = p_new_role
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

-- Step 4: Add security monitoring function for suspicious role activities
CREATE OR REPLACE FUNCTION public.log_role_change_attempt(
  p_admin_id uuid,
  p_target_id uuid,
  p_attempted_role user_role,
  p_success boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.gdpr_audit_log (
    event_type,
    user_id,
    admin_id,
    details,
    status,
    legal_basis,
    timestamp
  ) VALUES (
    CASE WHEN p_success THEN 'role_change_success' ELSE 'role_change_blocked' END,
    p_target_id,
    p_admin_id,
    jsonb_build_object(
      'attempted_role', p_attempted_role,
      'success', p_success,
      'reason', p_reason,
      'ip_context', 'admin_panel',
      'timestamp', now()
    ),
    CASE WHEN p_success THEN 'completed' ELSE 'blocked' END,
    'Security monitoring',
    now()
  );
END;
$$;