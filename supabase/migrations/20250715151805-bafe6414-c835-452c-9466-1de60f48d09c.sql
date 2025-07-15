-- Fix validate_password_reset_token to not mark tokens as used during validation
CREATE OR REPLACE FUNCTION public.validate_password_reset_token(
  p_token text,
  p_email text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reset_record record;
  token_hash text;
BEGIN
  -- Hash the provided token
  token_hash := public.hash_token(p_token);
  
  -- Find the reset token record
  SELECT * INTO reset_record
  FROM public.password_reset_tokens
  WHERE token_hash = validate_password_reset_token.token_hash
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
    'token_hash', token_hash
  );
END;
$$;

-- Add function to mark token as used (called after successful password reset)
CREATE OR REPLACE FUNCTION public.mark_password_reset_token_used(
  p_token_hash text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.password_reset_tokens
  SET used_at = now(),
      ip_address = COALESCE(p_ip_address, ip_address),
      user_agent = COALESCE(p_user_agent, user_agent)
  WHERE token_hash = p_token_hash;
END;
$$;