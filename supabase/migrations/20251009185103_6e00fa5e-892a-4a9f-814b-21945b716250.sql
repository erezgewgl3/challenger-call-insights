-- Fix Critical Security Issue: Recreate integration_connections_safe view with proper security
-- This ensures the view respects RLS policies from the underlying integration_connections table

-- Drop the existing view
DROP VIEW IF EXISTS public.integration_connections_safe;

-- Recreate the view with security_invoker = true
-- This ensures RLS policies from integration_connections table are enforced
CREATE VIEW public.integration_connections_safe
WITH (security_invoker = true, security_barrier = true)
AS
SELECT 
  id,
  user_id,
  integration_type,
  connection_name,
  connection_status,
  configuration,
  last_sync_at,
  sync_frequency_minutes,
  error_count,
  last_error,
  webhook_url,
  created_at,
  updated_at,
  -- Only show vault_secret_id to admins
  CASE 
    WHEN public.has_role((SELECT auth.uid()), 'admin') THEN vault_secret_id
    ELSE NULL
  END AS vault_secret_id
FROM public.integration_connections;

-- Grant select permission to authenticated users
GRANT SELECT ON public.integration_connections_safe TO authenticated;

-- Add documentation
COMMENT ON VIEW public.integration_connections_safe IS 
'Secure view of integration_connections. Uses security_invoker=true to enforce RLS policies from the underlying table. Vault secret IDs are only visible to admins.';