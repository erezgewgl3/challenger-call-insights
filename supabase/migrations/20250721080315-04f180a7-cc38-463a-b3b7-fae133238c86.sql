
-- Update transcripts table to track processing status
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Create index for efficient querying by processing status
CREATE INDEX IF NOT EXISTS idx_transcripts_processing_status ON transcripts(processing_status, created_at);

-- Update existing transcripts to have 'completed' status if they have analysis data
UPDATE transcripts 
SET processing_status = 'completed' 
WHERE id IN (
  SELECT transcript_id 
  FROM conversation_analysis 
  WHERE transcript_id IS NOT NULL
);
