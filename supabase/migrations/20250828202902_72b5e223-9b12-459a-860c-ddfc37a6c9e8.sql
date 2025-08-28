-- CRITICAL SECURITY FIX: Restrict system_integration_configs to admin users only
-- Currently ANY authenticated user can read sensitive API credentials (Zoom client_id/client_secret)

-- Drop the overly permissive policy that allows all users to read sensitive credentials
DROP POLICY IF EXISTS "system_integration_configs_unified_access" ON public.system_integration_configs;

-- Create admin-only policy using security definer function to avoid recursion
CREATE POLICY "system_integration_configs_admin_only" ON public.system_integration_configs
FOR ALL 
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');