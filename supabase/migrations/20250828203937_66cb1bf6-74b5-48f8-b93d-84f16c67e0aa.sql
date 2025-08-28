-- Fix critical security vulnerability in password_reset_tokens RLS policy
-- Remove the dangerous "OR true" condition that exposes all tokens to everyone

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "password_reset_tokens_unified_access" ON public.password_reset_tokens;

-- Create a secure policy that only allows admin users to access tokens
-- All user operations should go through SECURITY DEFINER functions (validate_password_reset_token, etc.)
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
'Password reset tokens are accessed only through SECURITY DEFINER functions like validate_password_reset_token(). Direct table access is restricted to admins only for monitoring purposes.';