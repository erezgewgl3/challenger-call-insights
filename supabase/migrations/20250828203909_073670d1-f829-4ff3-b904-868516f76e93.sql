-- Fix critical security vulnerability in password_reset_tokens RLS policy
-- Remove the dangerous "OR true" condition that exposes all tokens to everyone

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "password_reset_tokens_unified_access" ON public.password_reset_tokens;

-- Create a secure policy that only allows:
-- 1. Admin users to view all tokens (for monitoring/debugging)
-- 2. No direct user access (all operations should go through SECURITY DEFINER functions)
CREATE POLICY "password_reset_tokens_admin_only_access" 
ON public.password_reset_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add a comment to explain the security model
COMMENT ON TABLE public.password_reset_tokens IS 
'Password reset tokens are accessed only through SECURITY DEFINER functions. Direct table access is restricted to admins only for monitoring purposes. Users interact with tokens via validate_password_reset_token() and related functions.';

-- Log this security fix in the audit trail
INSERT INTO public.gdpr_audit_log (
  event_type,
  admin_id,
  details,
  status,
  legal_basis,
  timestamp
) VALUES (
  'security_fix_password_tokens',
  auth.uid(),
  jsonb_build_object(
    'issue', 'Removed dangerous OR true condition from password_reset_tokens RLS policy',
    'fix', 'Restricted access to admin-only for monitoring, all user operations via SECURITY DEFINER functions',
    'impact', 'Prevents unauthorized access to password reset tokens and email addresses',
    'timestamp', now()
  ),
  'completed',
  'Security hardening',
  now()
);