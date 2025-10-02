-- Add archive functionality to transcripts table
ALTER TABLE public.transcripts 
ADD COLUMN is_archived boolean DEFAULT false NOT NULL,
ADD COLUMN archived_at timestamptz,
ADD COLUMN archived_by uuid REFERENCES public.users(id);

-- Add indexes for archive queries
CREATE INDEX idx_transcripts_archived ON public.transcripts(is_archived);
CREATE INDEX idx_transcripts_archived_at ON public.transcripts(archived_at) WHERE archived_at IS NOT NULL;

-- Add audit logging trigger for archiving
CREATE OR REPLACE FUNCTION log_transcript_archive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_archived != OLD.is_archived THEN
    INSERT INTO public.gdpr_audit_log (
      event_type,
      user_id,
      details,
      status,
      legal_basis,
      timestamp
    ) VALUES (
      CASE WHEN NEW.is_archived THEN 'transcript_archived' ELSE 'transcript_unarchived' END,
      NEW.user_id,
      jsonb_build_object(
        'transcript_id', NEW.id,
        'archived_by', NEW.archived_by,
        'timestamp', now()
      ),
      'completed',
      'User action',
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER transcript_archive_audit
AFTER UPDATE ON public.transcripts
FOR EACH ROW
WHEN (OLD.is_archived IS DISTINCT FROM NEW.is_archived)
EXECUTE FUNCTION log_transcript_archive();