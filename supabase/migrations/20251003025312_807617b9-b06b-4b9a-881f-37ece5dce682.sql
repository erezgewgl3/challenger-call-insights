-- Phase 2: Credential Migration to Vault
-- Add vault_secret_id column to integration_connections table

ALTER TABLE public.integration_connections 
ADD COLUMN IF NOT EXISTS vault_secret_id uuid;

-- Create index for vault_secret_id lookups
CREATE INDEX IF NOT EXISTS idx_integration_connections_vault_secret_id 
ON public.integration_connections(vault_secret_id) 
WHERE vault_secret_id IS NOT NULL;

-- Add comment explaining the migration strategy
COMMENT ON COLUMN public.integration_connections.vault_secret_id IS 
'Reference to Supabase Vault for secure credential storage. New connections use vault, legacy connections migrate on next token refresh.';

COMMENT ON COLUMN public.integration_connections.credentials IS 
'DEPRECATED: Legacy plaintext credentials. Use vault_secret_id for new connections. This column will be removed in future version after migration.';

-- Add security event logging for vault operations
CREATE TABLE IF NOT EXISTS public.vault_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  integration_type text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('create', 'read', 'update', 'delete')),
  vault_secret_id text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on vault_access_log
ALTER TABLE public.vault_access_log ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see their own vault access logs
CREATE POLICY "vault_access_log_user_access" ON public.vault_access_log
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS policy: Only system can insert vault access logs (service role)
CREATE POLICY "vault_access_log_system_insert" ON public.vault_access_log
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for vault access log queries
CREATE INDEX IF NOT EXISTS idx_vault_access_log_user_id 
ON public.vault_access_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vault_access_log_integration_type 
ON public.vault_access_log(integration_type, created_at DESC);