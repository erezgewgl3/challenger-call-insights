-- Fix Supabase "Multiple Permissive Policies" Performance Warnings
-- Combine separate user/admin policies into unified policies with OR logic
-- This eliminates policy evaluation overhead and improves performance

-- 1. ACCOUNTS TABLE - Combine separate policies
DROP POLICY IF EXISTS "accounts_own_data" ON accounts;
DROP POLICY IF EXISTS "admins_view_all_accounts" ON accounts;

CREATE POLICY "accounts_unified_access" ON accounts
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 2. USERS TABLE - Combine separate policies  
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "admins_manage_users" ON users;

CREATE POLICY "users_unified_access" ON users
  FOR ALL USING (
    (select auth.uid()) = id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 3. TRANSCRIPTS TABLE - Combine policies
DROP POLICY IF EXISTS "transcripts_own_data" ON transcripts;
DROP POLICY IF EXISTS "admins_view_all_transcripts" ON transcripts;

CREATE POLICY "transcripts_unified_access" ON transcripts
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 4. CONVERSATION_ANALYSIS TABLE - Combine policies
DROP POLICY IF EXISTS "analysis_own_data" ON conversation_analysis;
DROP POLICY IF EXISTS "admins_view_all_analysis" ON conversation_analysis;

CREATE POLICY "analysis_unified_access" ON conversation_analysis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM transcripts WHERE id = conversation_analysis.transcript_id AND user_id = (select auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 5. INTEGRATION_CONNECTIONS TABLE - Combine policies
DROP POLICY IF EXISTS "integration_connections_own_data" ON integration_connections;
DROP POLICY IF EXISTS "admins_view_all_connections" ON integration_connections;

CREATE POLICY "integration_connections_unified_access" ON integration_connections
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 6. USER_CONSENT TABLE - Combine policies
DROP POLICY IF EXISTS "user_consent_own_data" ON user_consent;
DROP POLICY IF EXISTS "admins_manage_all_consent" ON user_consent;

CREATE POLICY "user_consent_unified_access" ON user_consent
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 7. ZAPIER API KEYS TABLE - Combine policies
DROP POLICY IF EXISTS "zapier_api_keys_optimized" ON zapier_api_keys;

CREATE POLICY "zapier_api_keys_unified_access" ON zapier_api_keys
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 8. ZAPIER WEBHOOKS TABLE - Combine policies
DROP POLICY IF EXISTS "zapier_webhooks_optimized" ON zapier_webhooks;

CREATE POLICY "zapier_webhooks_unified_access" ON zapier_webhooks
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 9. ZAPIER MATCH REVIEWS TABLE - Combine policies
DROP POLICY IF EXISTS "zapier_match_reviews_optimized" ON zapier_match_reviews;

CREATE POLICY "zapier_match_reviews_unified_access" ON zapier_match_reviews
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 10. CRM INTEGRATION LOGS TABLE - Combine policies
DROP POLICY IF EXISTS "crm_integration_logs_optimized" ON crm_integration_logs;

CREATE POLICY "crm_integration_logs_unified_access" ON crm_integration_logs
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 11. DEAL HEAT HISTORY TABLE - Combine policies
DROP POLICY IF EXISTS "deal_heat_history_optimized" ON deal_heat_history;

CREATE POLICY "deal_heat_history_unified_access" ON deal_heat_history
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 12. SYNC OPERATIONS TABLE - Combine policies
DROP POLICY IF EXISTS "sync_operations_optimized" ON sync_operations;

CREATE POLICY "sync_operations_unified_access" ON sync_operations
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 13. USER SYNC PREFERENCES TABLE - Combine policies
DROP POLICY IF EXISTS "user_sync_preferences_optimized" ON user_sync_preferences;

CREATE POLICY "user_sync_preferences_unified_access" ON user_sync_preferences
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 14. SYNC CONFLICTS TABLE - Combine policies
DROP POLICY IF EXISTS "sync_conflicts_optimized" ON sync_conflicts;

CREATE POLICY "sync_conflicts_unified_access" ON sync_conflicts
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 15. SYNC AUDIT TRAIL TABLE - Combine policies
DROP POLICY IF EXISTS "sync_audit_trail_optimized" ON sync_audit_trail;

CREATE POLICY "sync_audit_trail_unified_access" ON sync_audit_trail
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 16. ADVANCED WEBHOOK TRIGGERS TABLE - Combine policies
DROP POLICY IF EXISTS "advanced_webhook_triggers_optimized" ON advanced_webhook_triggers;

CREATE POLICY "advanced_webhook_triggers_unified_access" ON advanced_webhook_triggers
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 17. INTEGRATION CONFIGS TABLE - Combine policies
DROP POLICY IF EXISTS "integration_configs_optimized" ON integration_configs;

CREATE POLICY "integration_configs_unified_access" ON integration_configs
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 18. INTEGRATION SYNC OPERATIONS TABLE - Combine policies
DROP POLICY IF EXISTS "integration_sync_operations_optimized" ON integration_sync_operations;

CREATE POLICY "integration_sync_operations_unified_access" ON integration_sync_operations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM integration_connections ic WHERE ic.id = integration_sync_operations.connection_id AND ic.user_id = (select auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 19. INTEGRATION WEBHOOK LOGS TABLE - Combine policies
DROP POLICY IF EXISTS "integration_webhook_logs_optimized" ON integration_webhook_logs;

CREATE POLICY "integration_webhook_logs_unified_access" ON integration_webhook_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM integration_connections ic WHERE ic.id = integration_webhook_logs.connection_id AND ic.user_id = (select auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 20. ZAPIER WEBHOOK LOGS TABLE - Combine policies
DROP POLICY IF EXISTS "zapier_webhook_logs_optimized" ON zapier_webhook_logs;

CREATE POLICY "zapier_webhook_logs_unified_access" ON zapier_webhook_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM zapier_webhooks zw WHERE zw.id = zapier_webhook_logs.webhook_id AND zw.user_id = (select auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 21. TRANSCRIPT PROGRESS TABLE - Optimize existing policy
DROP POLICY IF EXISTS "transcript_progress_optimized" ON transcript_progress;

CREATE POLICY "transcript_progress_unified_access" ON transcript_progress
  FOR ALL USING (
    EXISTS (SELECT 1 FROM transcripts WHERE transcripts.id = transcript_progress.transcript_id AND transcripts.user_id = (select auth.uid()))
  );

-- 22. PROMPTS TABLE - Update to unified approach
DROP POLICY IF EXISTS "prompts_own_data" ON prompts;

CREATE POLICY "prompts_unified_access" ON prompts
  FOR ALL USING (
    user_id = (select auth.uid()) OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );