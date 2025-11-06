
-- Function to automatically reset transcripts stuck in processing
CREATE OR REPLACE FUNCTION reset_stuck_transcripts()
RETURNS TABLE (
  reset_count INTEGER,
  transcript_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stuck_ids UUID[];
  reset_total INTEGER;
BEGIN
  -- Find transcripts stuck in 'processing' for more than 15 minutes
  SELECT ARRAY_AGG(id)
  INTO stuck_ids
  FROM transcripts
  WHERE status = 'processing'
    AND processing_status = 'processing'
    AND created_at < NOW() - INTERVAL '15 minutes';
  
  -- Count how many we found
  reset_total := COALESCE(array_length(stuck_ids, 1), 0);
  
  -- Only proceed if we found any stuck transcripts
  IF reset_total > 0 THEN
    -- Reset them to 'uploaded' status with error message
    UPDATE transcripts
    SET 
      status = 'uploaded',
      processing_status = 'pending',
      error_message = 'Analysis timed out after 15 minutes. Ready to retry.'
    WHERE id = ANY(stuck_ids);
    
    -- Log the reset action
    RAISE NOTICE 'Reset % stuck transcripts: %', reset_total, stuck_ids;
  END IF;
  
  -- Return results
  RETURN QUERY SELECT reset_total, stuck_ids;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION reset_stuck_transcripts() TO authenticated, service_role;

-- Schedule the function to run every 5 minutes using pg_cron
SELECT cron.schedule(
  'reset-stuck-transcripts',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT reset_stuck_transcripts();
  $$
);
