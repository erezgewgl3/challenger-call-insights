-- Enable real-time updates for transcript queue system
-- This enables live updates for queue status, assignments, and progress

-- Enable REPLICA IDENTITY FULL for real-time change tracking
ALTER TABLE public.transcripts REPLICA IDENTITY FULL;
ALTER TABLE public.queue_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.external_transcript_queue REPLICA IDENTITY FULL;
ALTER TABLE public.transcript_progress REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication for real-time subscriptions
ALTER publication supabase_realtime ADD TABLE public.transcripts;
ALTER publication supabase_realtime ADD TABLE public.queue_assignments;
ALTER publication supabase_realtime ADD TABLE public.external_transcript_queue;
ALTER publication supabase_realtime ADD TABLE public.transcript_progress;