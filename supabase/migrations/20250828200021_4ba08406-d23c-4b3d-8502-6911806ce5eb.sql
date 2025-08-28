-- Fix Duplicate Index Performance Warning
-- Drop duplicate index to improve performance and eliminate warning

-- Remove the duplicate index (keeping the better-named one)
DROP INDEX IF EXISTS integration_configs_unique_user_type_key;

-- The remaining index 'unique_user_integration_config' will continue to handle
-- the same unique constraint functionality with better performance