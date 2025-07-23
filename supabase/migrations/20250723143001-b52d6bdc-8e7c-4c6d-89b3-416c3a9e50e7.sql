-- Add Zoom meeting tracking to transcripts table
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS source_meeting_id TEXT,
ADD COLUMN IF NOT EXISTS source_metadata JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN transcripts.source_meeting_id IS 'External meeting ID (e.g., Zoom meeting UUID) when source is integration';
COMMENT ON COLUMN transcripts.source_metadata IS 'Meeting metadata (topic, duration, attendees, etc.) from external source';

-- Create index for efficient Zoom meeting lookups
CREATE INDEX IF NOT EXISTS idx_transcripts_source_meeting 
ON transcripts(user_id, source_meeting_id) 
WHERE source_meeting_id IS NOT NULL;

-- Create index for efficient queue queries (find unprocessed meetings)
CREATE INDEX IF NOT EXISTS idx_transcripts_zoom_status 
ON transcripts(user_id, processing_status, source_meeting_id) 
WHERE source_meeting_id IS NOT NULL;