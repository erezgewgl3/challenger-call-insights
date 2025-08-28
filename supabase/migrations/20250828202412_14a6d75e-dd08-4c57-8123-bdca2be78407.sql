-- CRITICAL SECURITY FIX: Restrict system_integration_configs to admin users only
-- Currently ANY authenticated user can read sensitive API credentials (Zoom client_id/client_secret)

-- Drop the overly permissive policy that allows all users to read sensitive credentials
DROP POLICY IF EXISTS "system_integration_configs_unified_access" ON public.system_integration_configs;

-- Create admin-only policy using security definer function to avoid recursion
CREATE POLICY "system_integration_configs_admin_only" ON public.system_integration_configs
FOR ALL 
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Log this critical security fix
INSERT INTO public.gdpr_audit_log (
  event_type,
  admin_id,
  details,
  status,
  legal_basis,
  timestamp
) VALUES (
  'critical_security_fix_system_configs',
  auth.uid(),
  jsonb_build_object(
    'issue', 'Restricted system_integration_configs access to admin users only',
    'previous_policy', 'All authenticated users could read sensitive API credentials',
    'new_policy', 'Admin users only',
    'affected_table', 'system_integration_configs',
    'security_impact', 'HIGH - Prevented exposure of Zoom API credentials'
  ),
  'completed',
  'Security remediation',
  now()
);