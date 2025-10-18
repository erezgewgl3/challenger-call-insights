-- Phase 1: Fix Vault Audit Log Constraint Mismatch
-- The CHECK constraint expects 'create', 'read' but vault-helpers.ts uses 'store', 'retrieve'
-- Update constraint to match code usage

ALTER TABLE public.vault_access_log 
DROP CONSTRAINT IF EXISTS vault_access_log_operation_check;

ALTER TABLE public.vault_access_log 
ADD CONSTRAINT vault_access_log_operation_check 
CHECK (operation IN ('store', 'retrieve', 'update', 'delete'));

COMMENT ON CONSTRAINT vault_access_log_operation_check ON public.vault_access_log IS
'Validates vault operation types: store (create), retrieve (read), update, delete';

-- Phase 2: Drop integration_connections_safe view
-- Views cannot have RLS policies, and this view is not actively used in the codebase
-- The underlying integration_connections table already has proper RLS policies

DROP VIEW IF EXISTS public.integration_connections_safe;