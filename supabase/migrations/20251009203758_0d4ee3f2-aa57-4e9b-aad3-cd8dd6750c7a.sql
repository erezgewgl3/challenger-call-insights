-- Fix log_security_event function conflict
-- Drop all versions of the function to clean up duplicates
DROP FUNCTION IF EXISTS public.log_security_event(text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.log_security_event(unknown, uuid, jsonb);

-- Create a single, clean version with proper signature
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log failure silently to avoid breaking calling functions
    RAISE WARNING 'Failed to log security event: %', SQLERRM;
END;
$$;