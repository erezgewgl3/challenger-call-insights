-- Add new columns to existing transcripts table
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS zoho_deal_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS external_source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS assignment_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deal_context JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transcripts_zoho_deal_id ON transcripts(zoho_deal_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_external_source ON transcripts(external_source);
CREATE INDEX IF NOT EXISTS idx_transcripts_assigned_user ON transcripts(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_priority ON transcripts(priority_level);

-- Add check constraint for external_source
ALTER TABLE transcripts ADD CONSTRAINT valid_external_source 
CHECK (external_source IN ('manual', 'zoom', 'zapier', 'zoho', 'api'));

-- Add check constraint for priority_level
ALTER TABLE transcripts ADD CONSTRAINT valid_priority_level 
CHECK (priority_level IN ('urgent', 'high', 'normal', 'low'));

-- Track user assignment history and status
CREATE TABLE IF NOT EXISTS queue_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_queue_assignments_transcript ON queue_assignments(transcript_id);
CREATE INDEX IF NOT EXISTS idx_queue_assignments_user ON queue_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_queue_assignments_status ON queue_assignments(status);

-- Add check constraint for status
ALTER TABLE queue_assignments ADD CONSTRAINT valid_assignment_status 
CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));

-- Enable RLS
ALTER TABLE queue_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see assignments for their own transcripts or assignments to them
CREATE POLICY "queue_assignments_select_policy" ON queue_assignments
  FOR SELECT USING (
    assigned_to = auth.uid() OR 
    assigned_by = auth.uid() OR
    transcript_id IN (SELECT id FROM transcripts WHERE user_id = auth.uid())
  );

-- RLS Policy: Users can update their own assignments
CREATE POLICY "queue_assignments_update_policy" ON queue_assignments
  FOR UPDATE USING (assigned_to = auth.uid());

-- Manage processing queue for external transcripts
CREATE TABLE IF NOT EXISTS external_transcript_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  queue_status VARCHAR(20) DEFAULT 'pending',
  queue_position INTEGER,
  webhook_payload JSONB,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_external_queue_transcript ON external_transcript_queue(transcript_id);
CREATE INDEX IF NOT EXISTS idx_external_queue_status ON external_transcript_queue(queue_status);
CREATE INDEX IF NOT EXISTS idx_external_queue_position ON external_transcript_queue(queue_position);

-- Add check constraint for queue_status
ALTER TABLE external_transcript_queue ADD CONSTRAINT valid_queue_status 
CHECK (queue_status IN ('pending', 'assigned', 'processing', 'completed', 'failed'));

-- Enable RLS
ALTER TABLE external_transcript_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see queue items for their transcripts
CREATE POLICY "external_queue_select_policy" ON external_transcript_queue
  FOR SELECT USING (
    transcript_id IN (
      SELECT id FROM transcripts 
      WHERE user_id = auth.uid() OR assigned_user_id = auth.uid()
    )
  );

-- Function to lookup user by email
CREATE OR REPLACE FUNCTION lookup_user_by_email(email_address TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id 
  FROM users 
  WHERE email = email_address;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign transcript to user
CREATE OR REPLACE FUNCTION assign_transcript_to_user(
  transcript_uuid UUID,
  user_email TEXT,
  assignment_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  target_user_id UUID;
  assignment_id UUID;
  result JSONB;
BEGIN
  -- Look up user by email
  SELECT lookup_user_by_email(user_email) INTO target_user_id;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found',
      'email', user_email
    );
  END IF;
  
  -- Update transcript assignment
  UPDATE transcripts 
  SET assigned_user_id = target_user_id,
      updated_at = NOW()
  WHERE id = transcript_uuid;
  
  -- Create assignment record
  INSERT INTO queue_assignments (transcript_id, assigned_to, notes)
  VALUES (transcript_uuid, target_user_id, assignment_notes)
  RETURNING id INTO assignment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', assignment_id,
    'assigned_to', target_user_id,
    'email', user_email
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get queue summary for user
CREATE OR REPLACE FUNCTION get_user_queue_summary(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  summary JSONB;
BEGIN
  WITH queue_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE processing_status = 'pending' AND user_id = user_uuid) as owned_pending,
      COUNT(*) FILTER (WHERE processing_status = 'pending' AND assigned_user_id = user_uuid) as assigned_pending,
      COUNT(*) FILTER (WHERE priority_level = 'urgent' AND (user_id = user_uuid OR assigned_user_id = user_uuid)) as urgent_count,
      COUNT(*) FILTER (WHERE (user_id = user_uuid OR assigned_user_id = user_uuid)) as total_count
    FROM transcripts
    WHERE user_id = user_uuid OR assigned_user_id = user_uuid
  )
  SELECT jsonb_build_object(
    'owned_pending', owned_pending,
    'assigned_pending', assigned_pending,
    'urgent_count', urgent_count,
    'total_count', total_count
  ) INTO summary
  FROM queue_stats;
  
  RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update queue position when new external transcripts are added
CREATE OR REPLACE FUNCTION update_queue_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.external_source != 'manual' AND NEW.processing_status = 'pending' THEN
    -- Add to external queue
    INSERT INTO external_transcript_queue (transcript_id, queue_status, webhook_payload)
    VALUES (NEW.id, 'pending', NEW.assignment_metadata);
    
    -- Set queue position based on priority
    UPDATE external_transcript_queue 
    SET queue_position = (
      SELECT COALESCE(MAX(queue_position), 0) + 1 
      FROM external_transcript_queue 
      WHERE queue_status IN ('pending', 'assigned')
    )
    WHERE transcript_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to transcripts table
DROP TRIGGER IF EXISTS transcript_queue_trigger ON transcripts;
CREATE TRIGGER transcript_queue_trigger
  AFTER INSERT OR UPDATE ON transcripts
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_position();

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_queue_assignments_updated_at ON queue_assignments;
CREATE TRIGGER update_queue_assignments_updated_at 
  BEFORE UPDATE ON queue_assignments
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_queue_updated_at ON external_transcript_queue;
CREATE TRIGGER update_external_queue_updated_at 
  BEFORE UPDATE ON external_transcript_queue
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update transcript selection policy to include assigned transcripts
DROP POLICY IF EXISTS "transcripts_unified_access" ON transcripts;

CREATE POLICY "transcripts_unified_access" ON transcripts
  FOR ALL USING (
    user_id = auth.uid() OR 
    assigned_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );