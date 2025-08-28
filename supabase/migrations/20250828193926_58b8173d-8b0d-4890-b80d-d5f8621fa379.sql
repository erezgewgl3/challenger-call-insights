-- Final Supabase Performance Cleanup - Fix Remaining Issues (Safe Version)
-- Focus only on the specific multiple policy issues identified

-- 1. FIX INVITES TABLE - Only fix if multiple policies exist
DROP POLICY IF EXISTS "Public can validate invites" ON invites;
DROP POLICY IF EXISTS "invites_admin_manage" ON invites;

-- Create single unified policy for invites
CREATE POLICY "invites_unified_access" ON invites
  FOR ALL USING (
    -- Allow public read access for invite validation OR admin full access
    ((used_at IS NULL) AND (expires_at > now())) OR
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 2. FIX PASSWORD_RESET_TOKENS TABLE - Combine policies  
DROP POLICY IF EXISTS "Public can validate password reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "System can manage password reset tokens" ON password_reset_tokens;

-- Create single unified policy for password reset tokens
CREATE POLICY "password_reset_tokens_unified_access" ON password_reset_tokens
  FOR ALL USING (
    -- Allow public validation OR system-wide management
    ((used_at IS NULL) AND (expires_at > now())) OR true
  );

-- 3. FIX SYSTEM_INTEGRATION_CONFIGS TABLE - Only if multiple policies exist
DROP POLICY IF EXISTS "system_integration_configs_read" ON system_integration_configs;
DROP POLICY IF EXISTS "system_integration_configs_admin_manage" ON system_integration_configs;

-- Create single unified policy for system integration configs
CREATE POLICY "system_integration_configs_unified_access" ON system_integration_configs
  FOR SELECT USING (true); -- Public can read

CREATE POLICY "system_integration_configs_admin_modify" ON system_integration_configs
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- 4. FIX DUPLICATE CONSTRAINT ISSUE - Drop and recreate properly
ALTER TABLE integration_configs 
  DROP CONSTRAINT IF EXISTS integration_configs_user_id_integration_type_config_key_key;

-- Recreate with a better name
ALTER TABLE integration_configs 
  ADD CONSTRAINT integration_configs_unique_user_type_key 
  UNIQUE (user_id, integration_type, config_key);

-- 5. REFRESH STATISTICS ONLY
ANALYZE invites;
ANALYZE password_reset_tokens; 
ANALYZE system_integration_configs;
ANALYZE integration_configs;