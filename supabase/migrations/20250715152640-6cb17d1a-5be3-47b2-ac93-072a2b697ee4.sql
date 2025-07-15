-- Fix ambiguous column reference in validate_password_reset_token function
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
  computed_hash text;
BEGIN
  -- Hash the provided token
  computed_hash := public.hash_token(p_token);
  
  -- Find the reset token record (fix ambiguous column reference)
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
$$;