-- Phase 2: Authentication Hardening
-- Password policy enforcement and rate limiting

-- ============================================================================
-- 1. PASSWORD POLICY ENFORCEMENT
-- ============================================================================

-- Create function to validate password strength
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  has_uppercase boolean;
  has_lowercase boolean;
  has_number boolean;
  has_special boolean;
  password_length integer;
  common_passwords text[] := ARRAY[
    'password', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ];
BEGIN
  -- Check password length
  password_length := length(password);
  
  -- Check character types
  has_uppercase := password ~ '[A-Z]';
  has_lowercase := password ~ '[a-z]';
  has_number := password ~ '[0-9]';
  has_special := password ~ '[!@#$%^&*(),.?":{}|<>]';
  
  -- Build result
  result := jsonb_build_object(
    'valid', (
      password_length >= 12 AND
      has_uppercase AND
      has_lowercase AND
      has_number AND
      has_special AND
      NOT (lower(password) = ANY(common_passwords))
    ),
    'requirements', jsonb_build_object(
      'length', jsonb_build_object(
        'met', password_length >= 12,
        'message', 'Minimum 12 characters'
      ),
      'uppercase', jsonb_build_object(
        'met', has_uppercase,
        'message', 'At least one uppercase letter'
      ),
      'lowercase', jsonb_build_object(
        'met', has_lowercase,
        'message', 'At least one lowercase letter'
      ),
      'number', jsonb_build_object(
        'met', has_number,
        'message', 'At least one number'
      ),
      'special', jsonb_build_object(
        'met', has_special,
        'message', 'At least one special character'
      ),
      'not_common', jsonb_build_object(
        'met', NOT (lower(password) = ANY(common_passwords)),
        'message', 'Password is not in common password list'
      )
    )
  );
  
  RETURN result;
END;
$$;

-- ============================================================================
-- 2. AUTHENTICATION RATE LIMITING TABLES
-- ============================================================================

-- Create table to track login attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- email or IP address
  attempt_type text NOT NULL, -- 'login', 'password_reset', 'invite_generation'
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create index for rate limit queries
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier_type_time 
ON public.auth_rate_limits(identifier, attempt_type, attempted_at DESC);

-- Enable RLS on rate limits table
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate limit data
CREATE POLICY "auth_rate_limits_admin_only"
ON public.auth_rate_limits
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 3. RATE LIMITING FUNCTIONS
-- ============================================================================

-- Function to check login rate limit (5 attempts per 15 minutes)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_identifier text,
  p_ip_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_attempts integer;
  lockout_until timestamptz;
  is_allowed boolean;
BEGIN
  -- Count failed login attempts in last 15 minutes
  SELECT COUNT(*) INTO recent_attempts
  FROM public.auth_rate_limits
  WHERE identifier = p_identifier
    AND attempt_type = 'login'
    AND success = false
    AND attempted_at > now() - interval '15 minutes';
  
  -- Check if locked out
  IF recent_attempts >= 5 THEN
    SELECT attempted_at + interval '15 minutes' INTO lockout_until
    FROM public.auth_rate_limits
    WHERE identifier = p_identifier
      AND attempt_type = 'login'
      AND success = false
    ORDER BY attempted_at DESC
    LIMIT 1;
    
    is_allowed := now() > lockout_until;
  ELSE
    is_allowed := true;
  END IF;
  
  -- Log the attempt
  INSERT INTO public.auth_rate_limits (
    identifier,
    attempt_type,
    success,
    ip_address
  ) VALUES (
    p_identifier,
    'login',
    is_allowed,
    p_ip_address
  );
  
  RETURN jsonb_build_object(
    'allowed', is_allowed,
    'attempts', recent_attempts,
    'lockout_until', lockout_until
  );
END;
$$;

-- Function to check password reset rate limit (3 attempts per hour)
CREATE OR REPLACE FUNCTION public.check_password_reset_rate_limit(
  p_email text,
  p_ip_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_attempts integer;
  lockout_until timestamptz;
  is_allowed boolean;
BEGIN
  -- Count password reset attempts in last hour
  SELECT COUNT(*) INTO recent_attempts
  FROM public.auth_rate_limits
  WHERE identifier = p_email
    AND attempt_type = 'password_reset'
    AND attempted_at > now() - interval '1 hour';
  
  -- Check if locked out
  IF recent_attempts >= 3 THEN
    SELECT attempted_at + interval '1 hour' INTO lockout_until
    FROM public.auth_rate_limits
    WHERE identifier = p_email
      AND attempt_type = 'password_reset'
    ORDER BY attempted_at DESC
    LIMIT 1;
    
    is_allowed := now() > lockout_until;
  ELSE
    is_allowed := true;
  END IF;
  
  -- Log the attempt if allowed
  IF is_allowed THEN
    INSERT INTO public.auth_rate_limits (
      identifier,
      attempt_type,
      success,
      ip_address
    ) VALUES (
      p_email,
      'password_reset',
      true,
      p_ip_address
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', is_allowed,
    'attempts', recent_attempts,
    'lockout_until', lockout_until
  );
END;
$$;

-- Function to check invite generation rate limit (50 per day per admin)
CREATE OR REPLACE FUNCTION public.check_invite_rate_limit(
  p_admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_attempts integer;
  is_allowed boolean;
BEGIN
  -- Count invite generation attempts in last 24 hours
  SELECT COUNT(*) INTO recent_attempts
  FROM public.auth_rate_limits
  WHERE identifier = p_admin_id::text
    AND attempt_type = 'invite_generation'
    AND attempted_at > now() - interval '24 hours';
  
  is_allowed := recent_attempts < 50;
  
  -- Log the attempt if allowed
  IF is_allowed THEN
    INSERT INTO public.auth_rate_limits (
      identifier,
      attempt_type,
      success
    ) VALUES (
      p_admin_id::text,
      'invite_generation',
      true
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', is_allowed,
    'attempts', recent_attempts,
    'daily_limit', 50
  );
END;
$$;

-- Function to record successful login (resets failure count)
CREATE OR REPLACE FUNCTION public.record_successful_login(
  p_identifier text,
  p_ip_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auth_rate_limits (
    identifier,
    attempt_type,
    success,
    ip_address
  ) VALUES (
    p_identifier,
    'login',
    true,
    p_ip_address
  );
END;
$$;

-- ============================================================================
-- 4. CLEANUP FUNCTION FOR OLD RATE LIMIT DATA
-- ============================================================================

-- Function to cleanup old rate limit records (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE created_at < now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  INSERT INTO public.gdpr_audit_log (
    event_type,
    user_id,
    admin_id,
    details,
    status,
    legal_basis,
    timestamp
  ) VALUES (
    'auth_rate_limits_cleanup',
    NULL,
    NULL,
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', 30,
      'cleanup_time', now()
    ),
    'completed',
    'Data retention policy',
    now()
  );
  
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 5. SECURITY EVENT LOGGING ENHANCEMENT
-- ============================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.gdpr_audit_log (
    event_type,
    user_id,
    details,
    status,
    legal_basis,
    timestamp
  ) VALUES (
    p_event_type,
    p_user_id,
    p_details,
    'completed',
    'Security monitoring',
    now()
  );
END;
$$;

-- ============================================================================
-- 6. GRANT EXECUTE PERMISSIONS
-- ============================================================================

-- Grant execute permissions on security functions
GRANT EXECUTE ON FUNCTION public.validate_password_strength(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_password_reset_rate_limit(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_invite_rate_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_successful_login(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, uuid, jsonb) TO authenticated;

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.validate_password_strength IS 
'Validates password against security requirements: 12+ chars, uppercase, lowercase, number, special character, not in common password list';

COMMENT ON FUNCTION public.check_login_rate_limit IS 
'Rate limits login attempts: max 5 failed attempts per 15 minutes per identifier';

COMMENT ON FUNCTION public.check_password_reset_rate_limit IS 
'Rate limits password reset requests: max 3 requests per hour per email';

COMMENT ON FUNCTION public.check_invite_rate_limit IS 
'Rate limits invite generation: max 50 invites per 24 hours per admin';

COMMENT ON TABLE public.auth_rate_limits IS 
'Tracks authentication attempts for rate limiting. Automatically cleaned up after 30 days.';