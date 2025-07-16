-- Add new integration framework tables without modifying existing functionality
-- These tables provide a generic integration system alongside existing Sales Whisperer features

-- Integration Connections Table
-- Stores generic connection credentials and configuration for external integrations
CREATE TABLE integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_name text NOT NULL CHECK (length(connection_name) BETWEEN 1 AND 100),
  integration_type text NOT NULL CHECK (length(integration_type) BETWEEN 1 AND 50),
  connection_status text NOT NULL DEFAULT 'active' CHECK (connection_status IN ('active', 'inactive', 'error')),
  credentials jsonb NOT NULL DEFAULT '{}',
  configuration jsonb NOT NULL DEFAULT '{}',
  last_sync_at timestamptz,
  sync_frequency_minutes integer DEFAULT 60 CHECK (sync_frequency_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure unique connection names per user
  UNIQUE(user_id, connection_name)
);

-- Integration Webhook Logs Table  
-- Generic webhook event logging for all integration types
CREATE TABLE integration_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL,
  webhook_event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  headers jsonb NOT NULL DEFAULT '{}',
  processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  retry_count integer NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Integration Sync Operations Table
-- Tracks synchronization operations between Sales Whisperer and external systems
CREATE TABLE integration_sync_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('import', 'export', 'sync', 'validate')),
  operation_status text NOT NULL DEFAULT 'queued' CHECK (operation_status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  records_processed integer DEFAULT 0 CHECK (records_processed >= 0),
  records_total integer DEFAULT 0 CHECK (records_total >= 0),
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  operation_data jsonb NOT NULL DEFAULT '{}',
  error_details jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Integration Configurations Table
-- Flexible configuration storage for integration-specific settings
CREATE TABLE integration_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  integration_type text NOT NULL CHECK (length(integration_type) BETWEEN 1 AND 50),
  config_key text NOT NULL CHECK (length(config_key) BETWEEN 1 AND 100),
  config_value jsonb NOT NULL DEFAULT '{}',
  is_encrypted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure unique config keys per user per integration type
  UNIQUE(user_id, integration_type, config_key)
);

-- Enable Row Level Security on all new tables
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies following existing patterns

-- Integration Connections Policies
CREATE POLICY "Users own their integration connections" 
ON integration_connections FOR ALL 
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND id = integration_connections.user_id)
);

CREATE POLICY "Admins can view all integration connections" 
ON integration_connections FOR ALL 
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Integration Webhook Logs Policies  
CREATE POLICY "Users see webhook logs for their connections" 
ON integration_webhook_logs FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM integration_connections ic 
    JOIN users u ON ic.user_id = u.id 
    WHERE ic.id = integration_webhook_logs.connection_id 
    AND u.id = auth.uid()
  )
);

CREATE POLICY "Admins can view all webhook logs" 
ON integration_webhook_logs FOR ALL 
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Integration Sync Operations Policies
CREATE POLICY "Users see sync operations for their connections" 
ON integration_sync_operations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM integration_connections ic 
    JOIN users u ON ic.user_id = u.id 
    WHERE ic.id = integration_sync_operations.connection_id 
    AND u.id = auth.uid()
  )
);

CREATE POLICY "Admins can view all sync operations" 
ON integration_sync_operations FOR ALL 
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Integration Configurations Policies
CREATE POLICY "Users own their integration configs" 
ON integration_configs FOR ALL 
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND id = integration_configs.user_id)
);

CREATE POLICY "Admins can view all integration configs" 
ON integration_configs FOR ALL 
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Indexes for efficient querying following existing patterns
CREATE INDEX idx_integration_connections_user_id ON integration_connections(user_id);
CREATE INDEX idx_integration_connections_type_status ON integration_connections(integration_type, connection_status);
CREATE INDEX idx_integration_connections_last_sync ON integration_connections(last_sync_at) WHERE last_sync_at IS NOT NULL;

CREATE INDEX idx_integration_webhook_logs_connection_id ON integration_webhook_logs(connection_id);
CREATE INDEX idx_integration_webhook_logs_status_created ON integration_webhook_logs(processing_status, created_at);
CREATE INDEX idx_integration_webhook_logs_event_type ON integration_webhook_logs(webhook_event);

CREATE INDEX idx_integration_sync_operations_connection_id ON integration_sync_operations(connection_id);
CREATE INDEX idx_integration_sync_operations_status_created ON integration_sync_operations(operation_status, created_at);
CREATE INDEX idx_integration_sync_operations_type_status ON integration_sync_operations(operation_type, operation_status);

CREATE INDEX idx_integration_configs_user_type ON integration_configs(user_id, integration_type);
CREATE INDEX idx_integration_configs_key ON integration_configs(config_key);

-- Triggers for updated_at timestamps following existing patterns
CREATE TRIGGER update_integration_connections_updated_at 
  BEFORE UPDATE ON integration_connections 
  FOR EACH ROW EXECUTE FUNCTION update_prompts_updated_at();

CREATE TRIGGER update_integration_configs_updated_at 
  BEFORE UPDATE ON integration_configs 
  FOR EACH ROW EXECUTE FUNCTION update_prompts_updated_at();

-- Grant permissions to service_role following existing patterns
GRANT ALL ON integration_connections TO service_role;
GRANT ALL ON integration_webhook_logs TO service_role;
GRANT ALL ON integration_sync_operations TO service_role;
GRANT ALL ON integration_configs TO service_role;