
-- Add index for heat_level to optimize dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_analysis_heat_level 
ON conversation_analysis(heat_level) 
WHERE heat_level IS NOT NULL;

-- Add a function to backfill heat levels for existing records
CREATE OR REPLACE FUNCTION backfill_heat_levels()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This will be called after the edge function is updated
  -- For now, just ensure the index exists
  RAISE NOTICE 'Heat level backfill function created. Will be executed after edge function update.';
END;
$$;
