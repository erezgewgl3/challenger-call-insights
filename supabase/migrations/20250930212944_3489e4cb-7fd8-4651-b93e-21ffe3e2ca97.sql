-- Clean up corrupted transcripts that contain HTML login pages instead of actual transcripts
DELETE FROM conversation_analysis 
WHERE transcript_id IN (
  SELECT id FROM transcripts 
  WHERE raw_text LIKE '%<!DOCTYPE html>%' 
     OR raw_text LIKE '%Sign in to your Zoho account%'
     OR raw_text LIKE '%<html%'
);

-- Delete the corrupted transcript records
DELETE FROM transcripts 
WHERE raw_text LIKE '%<!DOCTYPE html>%' 
   OR raw_text LIKE '%Sign in to your Zoho account%'
   OR raw_text LIKE '%<html%';

-- Also clean up any orphaned analysis records
DELETE FROM conversation_analysis 
WHERE transcript_id NOT IN (SELECT id FROM transcripts);