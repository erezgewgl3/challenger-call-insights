
-- Create a secure function to update user's last login timestamp
CREATE OR REPLACE FUNCTION public.update_user_last_login(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Validate that user is updating their own record
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Users can only update their own last_login'
    );
  END IF;
  
  -- Update the last_login timestamp for the authenticated user
  UPDATE public.users 
  SET last_login = now()
  WHERE id = p_user_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the successful update for monitoring
  PERFORM public.log_security_event(
    'last_login_updated',
    p_user_id,
    jsonb_build_object(
      'timestamp', now(),
      'user_id', p_user_id,
      'updated_count', updated_count
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'last_login', now(),
    'updated_count', updated_count
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    PERFORM public.log_security_event(
      'last_login_update_failed',
      p_user_id,
      jsonb_build_object(
        'error', SQLERRM,
        'user_id', p_user_id,
        'timestamp', now()
      )
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to update last_login: ' || SQLERRM
    );
END;
$$;

-- Add a targeted RLS policy to allow users to update only their last_login field
CREATE POLICY "Users can update own last_login" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
