-- Add cleanup function for old webhook logs (data retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete webhook logs older than 30 days
  DELETE FROM zapier_webhook_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  INSERT INTO gdpr_audit_log (
    event_type,
    user_id,
    admin_id,
    details,
    status,
    legal_basis,
    timestamp
  ) VALUES (
    'webhook_logs_cleanup',
    NULL,
    NULL,
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', 30,
      'cleanup_time', NOW()
    ),
    'completed',
    'Data retention policy',
    NOW()
  );
  
  RETURN deleted_count;
END;
$$;

-- Add index to improve webhook log cleanup performance
CREATE INDEX IF NOT EXISTS idx_zapier_webhook_logs_created_at 
ON zapier_webhook_logs(created_at);

-- Add constraint to limit webhook URL length
ALTER TABLE zapier_webhooks 
ADD CONSTRAINT chk_webhook_url_length 
CHECK (char_length(webhook_url) <= 2048);

-- Add circuit breaker persistent state table
CREATE TABLE IF NOT EXISTS zapier_circuit_breakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES zapier_webhooks(id) ON DELETE CASCADE,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  circuit_state TEXT NOT NULL DEFAULT 'closed' CHECK (circuit_state IN ('closed', 'open', 'half_open')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(webhook_id)
);

-- Enable RLS on circuit breakers table
ALTER TABLE zapier_circuit_breakers ENABLE ROW LEVEL SECURITY;

-- Circuit breaker access policy
CREATE POLICY "Circuit breakers follow webhook access" ON zapier_circuit_breakers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM zapier_webhooks zw
    WHERE zw.id = webhook_id 
    AND (zw.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    ))
  )
);

-- Add trigger for circuit breaker updated_at
CREATE TRIGGER update_circuit_breakers_updated_at
  BEFORE UPDATE ON zapier_circuit_breakers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();