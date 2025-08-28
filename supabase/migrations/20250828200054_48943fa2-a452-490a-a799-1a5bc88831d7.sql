-- Fix Duplicate Index Performance Warning
-- Drop duplicate constraint to improve performance and eliminate warning

-- Remove the duplicate unique constraint (and its associated index)
ALTER TABLE integration_configs DROP CONSTRAINT IF EXISTS integration_configs_unique_user_type_key;

-- The remaining constraint 'unique_user_integration_config' will continue to handle
-- the same unique constraint functionality with better performance