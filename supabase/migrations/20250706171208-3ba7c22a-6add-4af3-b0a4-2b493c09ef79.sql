
-- Create progress tracking table for real-time transcript analysis updates
CREATE TABLE transcript_progress (
  transcript_id UUID PRIMARY KEY REFERENCES transcripts(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  phase TEXT NOT NULL DEFAULT 'starting',
  message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE transcript_progress ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only see progress for their own transcripts
CREATE POLICY "Users see progress for their transcripts" ON transcript_progress
  FOR ALL USING (EXISTS (
    SELECT 1 FROM transcripts 
    WHERE transcripts.id = transcript_progress.transcript_id 
    AND transcripts.user_id = auth.uid()
  ));

-- Enable real-time updates
ALTER TABLE transcript_progress REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE transcript_progress;
