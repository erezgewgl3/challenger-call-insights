-- Enable real-time updates for remaining tables (some may already be configured)
-- Enable REPLICA IDENTITY FULL for real-time change tracking
ALTER TABLE public.transcripts REPLICA IDENTITY FULL;
ALTER TABLE public.queue_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.external_transcript_queue REPLICA IDENTITY FULL;

-- Add remaining tables to supabase_realtime publication (skip transcript_progress as it's already added)
-- Using IF NOT EXISTS equivalent by checking if table is already in publication
DO $$
BEGIN
    -- Add transcripts if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'transcripts'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.transcripts;
    END IF;
    
    -- Add queue_assignments if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'queue_assignments'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.queue_assignments;
    END IF;
    
    -- Add external_transcript_queue if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'external_transcript_queue'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.external_transcript_queue;
    END IF;
END $$;