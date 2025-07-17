-- Add unique constraint to prevent duplicate integration configs
ALTER TABLE integration_configs 
ADD CONSTRAINT unique_user_integration_config 
UNIQUE (user_id, integration_type, config_key);