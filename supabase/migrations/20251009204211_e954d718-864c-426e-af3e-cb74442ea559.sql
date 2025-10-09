-- Fix log_security_event function conflict by removing all overloads
-- Drop ALL versions including the 5-argument overload that's causing ambiguity
DROP FUNCTION IF EXISTS public.log_security_event(text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.log_security_event(unknown, uuid, jsonb);
DROP FUNCTION IF EXISTS public.log_security_event(text, uuid, jsonb, text, text);

-- Create a single, canonical 3-argument version
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

-- Ensure authenticated users can call it
GRANT EXECUTE ON FUNCTION public.log_security_event(text, uuid, jsonb) TO authenticated;