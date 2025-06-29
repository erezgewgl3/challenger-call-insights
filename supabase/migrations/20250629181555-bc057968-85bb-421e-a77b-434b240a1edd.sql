
-- Add missing columns to conversation_analysis table for Sales Intelligence data
ALTER TABLE conversation_analysis 
ADD COLUMN IF NOT EXISTS participants jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS call_summary jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS key_takeaways jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recommendations jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS reasoning jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS action_plan jsonb DEFAULT '{}'::jsonb;

-- Add missing columns to transcripts table
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS error_message text;

-- Add index for better performance on transcript_id lookups
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_transcript_id 
ON conversation_analysis(transcript_id);

-- Update any existing transcripts with NULL processed_at to use created_at
UPDATE transcripts 
SET processed_at = created_at 
WHERE processed_at IS NULL AND status IN ('completed', 'error');
