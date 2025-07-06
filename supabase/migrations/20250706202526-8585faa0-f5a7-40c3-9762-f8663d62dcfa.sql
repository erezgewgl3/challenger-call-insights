
-- Clear all transcript-related data for clean testing
-- Delete in correct order to respect foreign key constraints

-- 1. Delete all conversation analysis records first (child table)
DELETE FROM public.conversation_analysis;

-- 2. Delete all transcript progress records (child table)
DELETE FROM public.transcript_progress;

-- 3. Delete all transcript records last (parent table)
DELETE FROM public.transcripts;
