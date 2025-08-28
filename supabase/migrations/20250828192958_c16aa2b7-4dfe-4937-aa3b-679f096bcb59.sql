-- Performance optimization: Replace auth.uid() with (select auth.uid()) in all RLS policies
-- This prevents the auth function from being re-evaluated for every row

-- 1. Users table policies
DROP POLICY IF EXISTS "Users can view own profile only" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;  
DROP POLICY IF EXISTS "Users can update own last_login" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Only admins can update user data" ON users;

CREATE POLICY "users_view_own_profile" ON users
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "users_update_own_profile" ON users  
  FOR UPDATE USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "admins_manage_users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 2. Integration connections table
DROP POLICY IF EXISTS "Admins can view all integration connections" ON integration_connections;
DROP POLICY IF EXISTS "Users own their integration connections" ON integration_connections;

CREATE POLICY "integration_connections_own_data" ON integration_connections
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "admins_view_all_connections" ON integration_connections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 3. Transcripts table
DROP POLICY IF EXISTS "Admins can view all transcripts" ON transcripts;
DROP POLICY IF EXISTS "Users own their transcripts" ON transcripts;

CREATE POLICY "transcripts_own_data" ON transcripts
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "admins_view_all_transcripts" ON transcripts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 4. Conversation analysis table
DROP POLICY IF EXISTS "Admins can view all analysis" ON conversation_analysis;
DROP POLICY IF EXISTS "Users see analysis for their transcripts" ON conversation_analysis;

CREATE POLICY "analysis_own_data" ON conversation_analysis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM transcripts WHERE id = conversation_analysis.transcript_id AND user_id = (select auth.uid()))
  );

CREATE POLICY "admins_view_all_analysis" ON conversation_analysis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 5. Accounts table
DROP POLICY IF EXISTS "Admins can view all accounts" ON accounts;
DROP POLICY IF EXISTS "Users manage their own accounts" ON accounts;

CREATE POLICY "accounts_own_data" ON accounts
  FOR ALL USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "admins_view_all_accounts" ON accounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 6. User consent table
DROP POLICY IF EXISTS "Admins can manage all consent" ON user_consent;
DROP POLICY IF EXISTS "Users can view own consent" ON user_consent;

CREATE POLICY "user_consent_own_data" ON user_consent
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "admins_manage_all_consent" ON user_consent
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 7. Prompts table
DROP POLICY IF EXISTS "Admins can manage all prompts" ON prompts;
DROP POLICY IF EXISTS "Users can view their own prompts" ON prompts;

CREATE POLICY "prompts_own_data" ON prompts
  FOR ALL USING (
    user_id = (select auth.uid()) OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 8. Zapier API keys
DROP POLICY IF EXISTS "Admins can view all Zapier API keys" ON zapier_api_keys;
DROP POLICY IF EXISTS "Users own their Zapier API keys" ON zapier_api_keys;

CREATE POLICY "zapier_api_keys_optimized" ON zapier_api_keys
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 9. Zapier webhooks
DROP POLICY IF EXISTS "Admins can view all Zapier webhooks" ON zapier_webhooks;
DROP POLICY IF EXISTS "Users own their Zapier webhooks" ON zapier_webhooks;

CREATE POLICY "zapier_webhooks_optimized" ON zapier_webhooks
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 10. Integration configs
DROP POLICY IF EXISTS "Admins can view all integration configs" ON integration_configs;
DROP POLICY IF EXISTS "Users own their integration configs" ON integration_configs;

CREATE POLICY "integration_configs_optimized" ON integration_configs
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 11. Sync operations
DROP POLICY IF EXISTS "Admins see all sync operations" ON sync_operations;
DROP POLICY IF EXISTS "Users own their sync operations" ON sync_operations;

CREATE POLICY "sync_operations_optimized" ON sync_operations
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 12. User sync preferences
DROP POLICY IF EXISTS "Admins see all sync preferences" ON user_sync_preferences;
DROP POLICY IF EXISTS "Users own their sync preferences" ON user_sync_preferences;

CREATE POLICY "user_sync_preferences_optimized" ON user_sync_preferences
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 13. CRM integration logs
DROP POLICY IF EXISTS "Admins can view all CRM integration logs" ON crm_integration_logs;
DROP POLICY IF EXISTS "Users see their own CRM integration logs" ON crm_integration_logs;

CREATE POLICY "crm_integration_logs_optimized" ON crm_integration_logs
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 14. Deal heat history
DROP POLICY IF EXISTS "Admins see all deal heat history" ON deal_heat_history;
DROP POLICY IF EXISTS "Users see their deal heat history" ON deal_heat_history;

CREATE POLICY "deal_heat_history_optimized" ON deal_heat_history
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 15. Zapier match reviews
DROP POLICY IF EXISTS "Admins can view all match reviews" ON zapier_match_reviews;
DROP POLICY IF EXISTS "Users own their match reviews" ON zapier_match_reviews;

CREATE POLICY "zapier_match_reviews_optimized" ON zapier_match_reviews
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 16. Advanced webhook triggers
DROP POLICY IF EXISTS "Admins see all webhook triggers" ON advanced_webhook_triggers;
DROP POLICY IF EXISTS "Users own their webhook triggers" ON advanced_webhook_triggers;

CREATE POLICY "advanced_webhook_triggers_optimized" ON advanced_webhook_triggers
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 17. Sync conflicts
DROP POLICY IF EXISTS "Admins see all sync conflicts" ON sync_conflicts;
DROP POLICY IF EXISTS "Users own their sync conflicts" ON sync_conflicts;

CREATE POLICY "sync_conflicts_optimized" ON sync_conflicts
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 18. Sync audit trail
DROP POLICY IF EXISTS "Admins see all sync audit trail" ON sync_audit_trail;
DROP POLICY IF EXISTS "Users see their sync audit trail" ON sync_audit_trail;

CREATE POLICY "sync_audit_trail_optimized" ON sync_audit_trail
  FOR ALL USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 19. Integration sync operations
DROP POLICY IF EXISTS "Admins can view all sync operations" ON integration_sync_operations;
DROP POLICY IF EXISTS "Users see sync operations for their connections" ON integration_sync_operations;

CREATE POLICY "integration_sync_operations_optimized" ON integration_sync_operations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM integration_connections ic WHERE ic.id = integration_sync_operations.connection_id AND ic.user_id = (select auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 20. Integration webhook logs
DROP POLICY IF EXISTS "Admins can view all webhook logs" ON integration_webhook_logs;
DROP POLICY IF EXISTS "Users see webhook logs for their connections" ON integration_webhook_logs;

CREATE POLICY "integration_webhook_logs_optimized" ON integration_webhook_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM integration_connections ic WHERE ic.id = integration_webhook_logs.connection_id AND ic.user_id = (select auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 21. Zapier webhook logs
DROP POLICY IF EXISTS "Admins can view all webhook logs" ON zapier_webhook_logs;
DROP POLICY IF EXISTS "Users see logs for their webhooks" ON zapier_webhook_logs;

CREATE POLICY "zapier_webhook_logs_optimized" ON zapier_webhook_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM zapier_webhooks zw WHERE zw.id = zapier_webhook_logs.webhook_id AND zw.user_id = (select auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 22. Transcript progress
DROP POLICY IF EXISTS "Users see progress for their transcripts" ON transcript_progress;

CREATE POLICY "transcript_progress_optimized" ON transcript_progress
  FOR ALL USING (
    EXISTS (SELECT 1 FROM transcripts WHERE transcripts.id = transcript_progress.transcript_id AND transcripts.user_id = (select auth.uid()))
  );

-- 23. Admin-only tables (keep existing admin policies but optimize)
DROP POLICY IF EXISTS "Only admins can manage system settings" ON system_settings;
CREATE POLICY "system_settings_admin_only" ON system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admins can manage registration failures" ON registration_failures;
CREATE POLICY "registration_failures_admin_only" ON registration_failures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage invites" ON invites;
DROP POLICY IF EXISTS "Admins manage invites" ON invites;
CREATE POLICY "invites_admin_manage" ON invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can access GDPR audit log" ON gdpr_audit_log;
CREATE POLICY "gdpr_audit_log_admin_only" ON gdpr_audit_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage deletion requests" ON deletion_requests;
CREATE POLICY "deletion_requests_admin_only" ON deletion_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage export requests" ON data_export_requests;
CREATE POLICY "data_export_requests_admin_only" ON data_export_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "All authenticated users can read system integration configs" ON system_integration_configs;
DROP POLICY IF EXISTS "Only admins can manage system integration configs" ON system_integration_configs;

CREATE POLICY "system_integration_configs_read" ON system_integration_configs
  FOR SELECT USING (true);

CREATE POLICY "system_integration_configs_admin_manage" ON system_integration_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );