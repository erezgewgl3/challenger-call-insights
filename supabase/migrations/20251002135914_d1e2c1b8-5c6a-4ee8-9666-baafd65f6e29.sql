-- Add metadata extraction columns to transcripts table
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS extracted_company_name TEXT,
ADD COLUMN IF NOT EXISTS extracted_participants JSONB;

-- Add index for company name lookups
CREATE INDEX IF NOT EXISTS idx_transcripts_extracted_company ON transcripts(extracted_company_name) WHERE extracted_company_name IS NOT NULL;

COMMENT ON COLUMN transcripts.extracted_company_name IS 'Company name extracted from AI analysis for better display';
COMMENT ON COLUMN transcripts.extracted_participants IS 'Structured participant data extracted from AI analysis';