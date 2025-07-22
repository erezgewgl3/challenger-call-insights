-- Add unique constraint for integration connections to support upsert
ALTER TABLE integration_connections 
ADD CONSTRAINT integration_connections_user_integration_unique 
UNIQUE (user_id, integration_type);