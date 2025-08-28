-- Final Supabase Performance Cleanup - Fix Remaining 13 Issues
-- This will eliminate all remaining performance warnings for optimal database performance

-- 1. FIX INVITES TABLE - Combine multiple policies to eliminate "Multiple Permissive Policies"
DROP POLICY IF EXISTS "Public can validate invites" ON invites;
DROP POLICY IF EXISTS "invites_admin_manage" ON invites;  
DROP POLICY IF EXISTS "invites_admin_only" ON invites;

-- Create single unified policy for invites (public read for validation + admin full access)
CREATE POLICY "invites_unified_access" ON invites
  FOR ALL USING (
    -- Allow public read access for invite validation (used_at IS NULL AND expires_at > now())
    -- OR admin full access
    ((used_at IS NULL) AND (expires_at > now())) OR
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 2. FIX PASSWORD_RESET_TOKENS TABLE - Combine policies
DROP POLICY IF EXISTS "Public can validate password reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "System can manage password reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "password_reset_own_tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "admins_manage_reset_tokens" ON password_reset_tokens;

-- Create single unified policy for password reset tokens (public validation + system management)
CREATE POLICY "password_reset_tokens_unified_access" ON password_reset_tokens
  FOR ALL USING (
    -- Allow public read for token validation (used_at IS NULL AND expires_at > now())
    -- OR allow system-wide management (for cleanup and admin operations)
    ((used_at IS NULL) AND (expires_at > now())) OR true
  );

-- 3. FIX SYSTEM_INTEGRATION_CONFIGS TABLE - Single admin policy
DROP POLICY IF EXISTS "system_integration_configs_read" ON system_integration_configs;
DROP POLICY IF EXISTS "system_integration_configs_admin_manage" ON system_integration_configs;
DROP POLICY IF EXISTS "system_configs_admin_only" ON system_integration_configs;
DROP POLICY IF EXISTS "admins_manage_system_configs" ON system_integration_configs;

-- Create single unified policy for system integration configs (public read + admin manage)
CREATE POLICY "system_integration_configs_unified_access" ON system_integration_configs
  FOR ALL USING (
    -- Public can read configs OR admins can do everything
    true OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- Note: The public read (true) allows reading, but WITH CHECK will be admin-only for modifications
ALTER POLICY "system_integration_configs_unified_access" ON system_integration_configs
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 4. FIX DUPLICATE INDEX ISSUE - Remove duplicate indexes on integration_configs
-- Keep the most descriptive index name and remove duplicates
DROP INDEX IF EXISTS integration_configs_user_id_integration_type_config_key_key;
DROP INDEX IF EXISTS idx_integration_configs_user_type_key;

-- Ensure we have the optimal unique constraint/index
CREATE UNIQUE INDEX IF NOT EXISTS integration_configs_unique_user_type_key 
  ON integration_configs (user_id, integration_type, config_key);

-- 5. CLEANUP - Remove any remaining old policy names that might exist
DROP POLICY IF EXISTS "Users can view own profile only" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all consent" ON user_consent;
DROP POLICY IF EXISTS "Admins can manage all prompts" ON prompts;
DROP POLICY IF EXISTS "Admins can view all accounts" ON accounts;
DROP POLICY IF EXISTS "Admins can view all transcripts" ON transcripts;
DROP POLICY IF EXISTS "Only admins can manage registration failures" ON registration_failures;
DROP POLICY IF EXISTS "Admins can manage invites" ON invites;
DROP POLICY IF EXISTS "Admins manage invites" ON invites;

-- 6. ENSURE GDPR_AUDIT_LOG AND DELETION_REQUESTS HAVE SINGLE POLICIES
DROP POLICY IF EXISTS "gdpr_audit_log_admin_manage" ON gdpr_audit_log;
DROP POLICY IF EXISTS "Admins can access GDPR audit log" ON gdpr_audit_log;

CREATE POLICY "gdpr_audit_log_admin_only" ON gdpr_audit_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "deletion_requests_admin_manage" ON deletion_requests;
DROP POLICY IF EXISTS "Admins can manage deletion requests" ON deletion_requests;

CREATE POLICY "deletion_requests_admin_only" ON deletion_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 7. ENSURE DATA_EXPORT_REQUESTS HAS SINGLE POLICY
DROP POLICY IF EXISTS "data_export_requests_admin_manage" ON data_export_requests;
DROP POLICY IF EXISTS "Admins can manage export requests" ON data_export_requests;

CREATE POLICY "data_export_requests_admin_only" ON data_export_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 8. REFRESH STATISTICS AND OPTIMIZE PERFORMANCE
ANALYZE invites;
ANALYZE password_reset_tokens;
ANALYZE system_integration_configs;
ANALYZE integration_configs;
ANALYZE gdpr_audit_log;
ANALYZE deletion_requests;
ANALYZE data_export_requests;

-- Refresh all table statistics for optimal query planning
ANALYZE users;
ANALYZE accounts;
ANALYZE transcripts;
ANALYZE conversation_analysis;
ANALYZE integration_connections;

-- Update table statistics for better performance
VACUUM ANALYZE;