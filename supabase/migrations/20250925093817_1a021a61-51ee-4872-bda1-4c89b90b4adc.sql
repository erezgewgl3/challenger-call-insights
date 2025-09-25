-- Fix security vulnerability in invites table RLS policy
-- Issue: Current policy allows any user to read all unused, non-expired invites
-- Fix: Restrict access to admins only and create secure validation function

-- First, update the RLS policy to be admin-only
DROP POLICY IF EXISTS "invites_unified_access" ON public.invites;

CREATE POLICY "invites_admin_only_access" 
ON public.invites
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Create secure validation function for invite tokens
-- This function allows validation without exposing sensitive data
CREATE OR REPLACE FUNCTION public.validate_invite_token_secure(
  p_token text, 
  p_email text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record record;
  user_record record;
  result jsonb;
BEGIN
  -- Validate input parameters
  IF p_token IS NULL OR p_email IS NULL OR 
     length(trim(p_token)) = 0 OR length(trim(p_email)) = 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Token and email are required'
    );
  END IF;
  
  -- Check if invite exists and is valid
  SELECT * INTO invite_record
  FROM public.invites
  WHERE token = p_token 
    AND email = p_email 
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid or expired invite token'
    );
  END IF;
  
  -- Check if invite is already used
  IF invite_record.used_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invite token has already been used'
    );
  END IF;
  
  -- Check if user already exists
  SELECT * INTO user_record
  FROM public.users
  WHERE email = p_email;
  
  IF FOUND THEN
    -- If user exists with pending_deletion status, allow password reset
    IF user_record.status = 'pending_deletion' THEN
      RETURN jsonb_build_object(
        'valid', true,
        'invite_id', invite_record.id,
        'requires_password_reset', true,
        'existing_user_id', user_record.id
      );
    ELSE
      -- User exists and is active
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'User already exists and is active. Please log in instead.'
      );
    END IF;
  END IF;
  
  -- Valid invite for new user registration
  RETURN jsonb_build_object(
    'valid', true,
    'invite_id', invite_record.id,
    'requires_password_reset', false
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging but don't expose details
    RAISE LOG 'Invite validation error for token %: %', p_token, SQLERRM;
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Failed to validate invite token'
    );
END;
$$;

-- Create secure function to mark invite as used
CREATE OR REPLACE FUNCTION public.mark_invite_as_used_secure(p_invite_id uuid) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invites 
  SET used_at = now()
  WHERE id = p_invite_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invite not found'
    );
  END IF;
  
  RETURN jsonb_build_object('success', true);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to mark invite as used'
    );
END;
$$;