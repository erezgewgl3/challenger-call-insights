-- Add coaching_insights column and create quality monitoring table

BEGIN;

-- Add missing coaching_insights column to conversation_analysis
ALTER TABLE conversation_analysis 
ADD COLUMN IF NOT EXISTS coaching_insights JSONB;

-- Add index for performance on coaching_insights
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_coaching 
ON conversation_analysis USING gin(coaching_insights);

-- Create quality monitoring table for tracking analysis issues
CREATE TABLE IF NOT EXISTS analysis_quality_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES conversation_analysis(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('fabricated_quotes', 'missing_fields', 'schema_invalid')),
  details JSONB,
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Add indexes for quality flags
CREATE INDEX IF NOT EXISTS idx_quality_flags_analysis 
ON analysis_quality_flags(analysis_id);

CREATE INDEX IF NOT EXISTS idx_quality_flags_unresolved 
ON analysis_quality_flags(flagged_at) WHERE resolved_at IS NULL;

-- Enable RLS for quality flags (admin only)
ALTER TABLE analysis_quality_flags ENABLE ROW LEVEL SECURITY;

-- Admin-only policy for quality flags
CREATE POLICY "quality_flags_admin_all"
ON analysis_quality_flags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

COMMIT;