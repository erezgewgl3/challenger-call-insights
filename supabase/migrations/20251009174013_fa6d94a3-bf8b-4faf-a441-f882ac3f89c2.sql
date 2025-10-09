-- Phase 1: Database RLS Policy Hardening
-- Comprehensive security fixes for all sensitive tables

-- ============================================================================
-- 1. INTEGRATION CONNECTIONS - Secure credentials storage
-- ============================================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "integration_connections_unified_access" ON public.integration_connections;

-- Create restrictive operation-specific policies
CREATE POLICY "integration_connections_select_own_or_admin"
ON public.integration_connections
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "integration_connections_insert_own"
ON public.integration_connections
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_connections_update_own_or_admin"
ON public.integration_connections
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "integration_connections_delete_own_or_admin"
ON public.integration_connections
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- Create a safe view that excludes credentials
CREATE OR REPLACE VIEW public.integration_connections_safe AS
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
  -- Exclude: credentials, vault_secret_id
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN vault_secret_id
    ELSE NULL
  END as vault_secret_id
FROM public.integration_connections
WHERE (auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin');

-- ============================================================================
-- 2. INTEGRATION CONFIGS - User-owned configurations
-- ============================================================================

DROP POLICY IF EXISTS "integration_configs_unified_access" ON public.integration_configs;

CREATE POLICY "integration_configs_select_own_or_admin"
ON public.integration_configs
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "integration_configs_insert_own"
ON public.integration_configs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_configs_update_own_or_admin"
ON public.integration_configs
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "integration_configs_delete_own_or_admin"
ON public.integration_configs
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- 3. INTEGRATION WEBHOOK LOGS - Follow connection ownership
-- ============================================================================

DROP POLICY IF EXISTS "integration_webhook_logs_unified_access" ON public.integration_webhook_logs;

CREATE POLICY "integration_webhook_logs_select"
ON public.integration_webhook_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.integration_connections ic
    WHERE ic.id = integration_webhook_logs.connection_id
    AND (ic.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "integration_webhook_logs_insert_system"
ON public.integration_webhook_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.integration_connections ic
    WHERE ic.id = connection_id
    AND ic.user_id = auth.uid()
  )
);

CREATE POLICY "integration_webhook_logs_update_admin"
ON public.integration_webhook_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "integration_webhook_logs_delete_admin"
ON public.integration_webhook_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 4. ZAPIER API KEYS - Owner + Admin only
-- ============================================================================

DROP POLICY IF EXISTS "zapier_api_keys_unified_access" ON public.zapier_api_keys;

CREATE POLICY "zapier_api_keys_select_own_or_admin"
ON public.zapier_api_keys
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "zapier_api_keys_insert_own"
ON public.zapier_api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "zapier_api_keys_update_own_or_admin"
ON public.zapier_api_keys
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "zapier_api_keys_delete_own_or_admin"
ON public.zapier_api_keys
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- 5. ZAPIER WEBHOOKS - Owner + Admin only
-- ============================================================================

DROP POLICY IF EXISTS "zapier_webhooks_unified_access" ON public.zapier_webhooks;

CREATE POLICY "zapier_webhooks_select_own_or_admin"
ON public.zapier_webhooks
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "zapier_webhooks_insert_own"
ON public.zapier_webhooks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "zapier_webhooks_update_own_or_admin"
ON public.zapier_webhooks
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "zapier_webhooks_delete_own_or_admin"
ON public.zapier_webhooks
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- 6. ZAPIER WEBHOOK LOGS - Follow webhook ownership
-- ============================================================================

DROP POLICY IF EXISTS "zapier_webhook_logs_unified_access" ON public.zapier_webhook_logs;

CREATE POLICY "zapier_webhook_logs_select"
ON public.zapier_webhook_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.zapier_webhooks zw
    WHERE zw.id = zapier_webhook_logs.webhook_id
    AND (zw.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "zapier_webhook_logs_insert_system"
ON public.zapier_webhook_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.zapier_webhooks zw
    WHERE zw.id = webhook_id
    AND zw.user_id = auth.uid()
  )
);

CREATE POLICY "zapier_webhook_logs_update_admin"
ON public.zapier_webhook_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "zapier_webhook_logs_delete_admin"
ON public.zapier_webhook_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 7. TRANSCRIPTS - Owner, assigned user, or admin
-- ============================================================================

DROP POLICY IF EXISTS "transcripts_unified_access" ON public.transcripts;

CREATE POLICY "transcripts_select_access"
ON public.transcripts
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() = assigned_user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "transcripts_insert_own"
ON public.transcripts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transcripts_update_access"
ON public.transcripts
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() = assigned_user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (auth.uid() = assigned_user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "transcripts_delete_own_or_admin"
ON public.transcripts
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- 8. CONVERSATION ANALYSIS - Follow transcript ownership
-- ============================================================================

DROP POLICY IF EXISTS "analysis_unified_access" ON public.conversation_analysis;

CREATE POLICY "conversation_analysis_select"
ON public.conversation_analysis
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transcripts t
    WHERE t.id = conversation_analysis.transcript_id
    AND (t.user_id = auth.uid() OR t.assigned_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "conversation_analysis_insert"
ON public.conversation_analysis
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transcripts t
    WHERE t.id = transcript_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "conversation_analysis_update_admin"
ON public.conversation_analysis
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "conversation_analysis_delete_admin"
ON public.conversation_analysis
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 9. SYNC OPERATIONS - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "sync_operations_unified_access" ON public.sync_operations;

CREATE POLICY "sync_operations_select_own_or_admin"
ON public.sync_operations
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "sync_operations_insert_own"
ON public.sync_operations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sync_operations_update_own_or_admin"
ON public.sync_operations
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "sync_operations_delete_admin"
ON public.sync_operations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 10. SYNC CONFLICTS - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "sync_conflicts_unified_access" ON public.sync_conflicts;

CREATE POLICY "sync_conflicts_select_own_or_admin"
ON public.sync_conflicts
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "sync_conflicts_insert_system"
ON public.sync_conflicts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sync_conflicts_update_own_or_admin"
ON public.sync_conflicts
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "sync_conflicts_delete_admin"
ON public.sync_conflicts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 11. SYNC AUDIT TRAIL - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "sync_audit_trail_unified_access" ON public.sync_audit_trail;

CREATE POLICY "sync_audit_trail_select_own_or_admin"
ON public.sync_audit_trail
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "sync_audit_trail_insert_system"
ON public.sync_audit_trail
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Audit trail should be immutable - no updates or deletes except by admin
CREATE POLICY "sync_audit_trail_delete_admin"
ON public.sync_audit_trail
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 12. CRM INTEGRATION LOGS - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "crm_integration_logs_unified_access" ON public.crm_integration_logs;

CREATE POLICY "crm_integration_logs_select_own_or_admin"
ON public.crm_integration_logs
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "crm_integration_logs_insert_own"
ON public.crm_integration_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "crm_integration_logs_update_admin"
ON public.crm_integration_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "crm_integration_logs_delete_admin"
ON public.crm_integration_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 13. DEAL HEAT HISTORY - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "deal_heat_history_unified_access" ON public.deal_heat_history;

CREATE POLICY "deal_heat_history_select_own_or_admin"
ON public.deal_heat_history
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "deal_heat_history_insert_own"
ON public.deal_heat_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Heat history should be immutable
CREATE POLICY "deal_heat_history_delete_admin"
ON public.deal_heat_history
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 14. WEBHOOK DELIVERY LOG - Follow transcript ownership
-- ============================================================================

DROP POLICY IF EXISTS "webhook_log_unified_access" ON public.webhook_delivery_log;

CREATE POLICY "webhook_delivery_log_select"
ON public.webhook_delivery_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transcripts t
    WHERE t.id = webhook_delivery_log.transcript_id
    AND (t.user_id = auth.uid() OR t.assigned_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "webhook_delivery_log_insert_system"
ON public.webhook_delivery_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transcripts t
    WHERE t.id = transcript_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "webhook_delivery_log_delete_admin"
ON public.webhook_delivery_log
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 15. USER SYNC PREFERENCES - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "user_sync_preferences_unified_access" ON public.user_sync_preferences;

CREATE POLICY "user_sync_preferences_select_own_or_admin"
ON public.user_sync_preferences
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "user_sync_preferences_insert_own"
ON public.user_sync_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_sync_preferences_update_own_or_admin"
ON public.user_sync_preferences
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "user_sync_preferences_delete_own_or_admin"
ON public.user_sync_preferences
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- 16. ZAPIER MATCH REVIEWS - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "zapier_match_reviews_unified_access" ON public.zapier_match_reviews;

CREATE POLICY "zapier_match_reviews_select_own_or_admin"
ON public.zapier_match_reviews
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "zapier_match_reviews_insert_own"
ON public.zapier_match_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "zapier_match_reviews_update_own_or_admin"
ON public.zapier_match_reviews
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "zapier_match_reviews_delete_admin"
ON public.zapier_match_reviews
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 17. ZAPIER CONNECTION VERIFICATIONS - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "zapier_verifications_unified_access" ON public.zapier_connection_verifications;

CREATE POLICY "zapier_verifications_select_own_or_admin"
ON public.zapier_connection_verifications
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "zapier_verifications_insert_own"
ON public.zapier_connection_verifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "zapier_verifications_delete_admin"
ON public.zapier_connection_verifications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 18. INTEGRATION SYNC OPERATIONS - Follow connection ownership
-- ============================================================================

DROP POLICY IF EXISTS "integration_sync_operations_unified_access" ON public.integration_sync_operations;

CREATE POLICY "integration_sync_operations_select"
ON public.integration_sync_operations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.integration_connections ic
    WHERE ic.id = integration_sync_operations.connection_id
    AND (ic.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "integration_sync_operations_insert_system"
ON public.integration_sync_operations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.integration_connections ic
    WHERE ic.id = connection_id
    AND ic.user_id = auth.uid()
  )
);

CREATE POLICY "integration_sync_operations_update_own_or_admin"
ON public.integration_sync_operations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.integration_connections ic
    WHERE ic.id = connection_id
    AND (ic.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.integration_connections ic
    WHERE ic.id = connection_id
    AND (ic.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "integration_sync_operations_delete_admin"
ON public.integration_sync_operations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 19. ADVANCED WEBHOOK TRIGGERS - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "advanced_webhook_triggers_unified_access" ON public.advanced_webhook_triggers;

CREATE POLICY "advanced_webhook_triggers_select_own_or_admin"
ON public.advanced_webhook_triggers
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "advanced_webhook_triggers_insert_own"
ON public.advanced_webhook_triggers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "advanced_webhook_triggers_update_own_or_admin"
ON public.advanced_webhook_triggers
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "advanced_webhook_triggers_delete_own_or_admin"
ON public.advanced_webhook_triggers
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- 20. ACCOUNTS - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "accounts_unified_access" ON public.accounts;

CREATE POLICY "accounts_select_own_or_admin"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "accounts_insert_own"
ON public.accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_update_own_or_admin"
ON public.accounts
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "accounts_delete_own_or_admin"
ON public.accounts
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- 21. USER CONSENT - Owner + Admin
-- ============================================================================

DROP POLICY IF EXISTS "user_consent_unified_access" ON public.user_consent;

CREATE POLICY "user_consent_select_own_or_admin"
ON public.user_consent
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "user_consent_insert_own"
ON public.user_consent
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_consent_update_own_or_admin"
ON public.user_consent
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "user_consent_delete_admin"
ON public.user_consent
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 22. TRANSCRIPT PROGRESS - Follow transcript ownership
-- ============================================================================

DROP POLICY IF EXISTS "transcript_progress_unified_access" ON public.transcript_progress;

CREATE POLICY "transcript_progress_select"
ON public.transcript_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transcripts t
    WHERE t.id = transcript_progress.transcript_id
    AND (t.user_id = auth.uid() OR t.assigned_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "transcript_progress_insert_system"
ON public.transcript_progress
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transcripts t
    WHERE t.id = transcript_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "transcript_progress_update_system"
ON public.transcript_progress
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transcripts t
    WHERE t.id = transcript_id
    AND t.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transcripts t
    WHERE t.id = transcript_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "transcript_progress_delete_admin"
ON public.transcript_progress
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 23. Verify all tables have RLS enabled
-- ============================================================================

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections FORCE ROW LEVEL SECURITY;

ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_configs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.integration_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_webhook_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.zapier_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapier_api_keys FORCE ROW LEVEL SECURITY;

ALTER TABLE public.zapier_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapier_webhooks FORCE ROW LEVEL SECURITY;

ALTER TABLE public.zapier_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapier_webhook_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.conversation_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_analysis FORCE ROW LEVEL SECURITY;

ALTER TABLE public.sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_operations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_conflicts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.sync_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_audit_trail FORCE ROW LEVEL SECURITY;

ALTER TABLE public.crm_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_integration_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.deal_heat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_heat_history FORCE ROW LEVEL SECURITY;

ALTER TABLE public.webhook_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_log FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_sync_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sync_preferences FORCE ROW LEVEL SECURITY;

ALTER TABLE public.zapier_match_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapier_match_reviews FORCE ROW LEVEL SECURITY;

ALTER TABLE public.zapier_connection_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapier_connection_verifications FORCE ROW LEVEL SECURITY;

ALTER TABLE public.integration_sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync_operations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.advanced_webhook_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_webhook_triggers FORCE ROW LEVEL SECURITY;

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent FORCE ROW LEVEL SECURITY;

ALTER TABLE public.transcript_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_progress FORCE ROW LEVEL SECURITY;