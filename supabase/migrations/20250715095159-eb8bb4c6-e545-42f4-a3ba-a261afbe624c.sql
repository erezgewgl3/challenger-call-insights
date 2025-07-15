-- Create password reset tokens table with security and guide rails
CREATE TABLE public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  attempts integer DEFAULT 0,
  ip_address text,
  user_agent text
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can validate password reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
USING (used_at IS NULL AND expires_at > now());

CREATE POLICY "System can manage password reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
USING (true);

-- Indexes for performance
CREATE INDEX idx_password_reset_tokens_hash ON public.password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Function to hash tokens securely
CREATE OR REPLACE FUNCTION public.hash_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(digest(token, 'sha256'), 'hex');
END;
$$;

-- Function to cleanup expired tokens (guide rail)
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() - interval '24 hours';
END;
$$;

-- Function to validate and use password reset token
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
    -- Increment attempts for security monitoring
    UPDATE public.password_reset_tokens 
    SET attempts = attempts + 1
    WHERE token_hash = validate_password_reset_token.token_hash;
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid or expired reset token'
    );
  END IF;
  
  -- Rate limiting check (guide rail)
  IF reset_record.attempts >= 5 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Too many validation attempts. Please request a new reset link.'
    );
  END IF;
  
  -- Mark token as used (single use enforcement)
  UPDATE public.password_reset_tokens
  SET used_at = now(),
      ip_address = COALESCE(p_ip_address, ip_address),
      user_agent = COALESCE(p_user_agent, user_agent)
  WHERE id = reset_record.id;
  
  RETURN jsonb_build_object(
    'valid', true,
    'reset_id', reset_record.id,
    'email', reset_record.email
  );
END;
$$;