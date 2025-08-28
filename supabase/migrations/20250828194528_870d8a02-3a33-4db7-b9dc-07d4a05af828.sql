-- Fix Function Search Path Security Warning
-- Recreate function with explicit search_path to eliminate security vulnerability

-- Drop the existing function and its trigger
DROP FUNCTION IF EXISTS update_system_integration_configs_updated_at() CASCADE;

-- Recreate the function with secure search_path
CREATE OR REPLACE FUNCTION update_system_integration_configs_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;

-- Recreate the trigger that was dropped by CASCADE
CREATE TRIGGER update_system_integration_configs_updated_at
    BEFORE UPDATE ON system_integration_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_system_integration_configs_updated_at();