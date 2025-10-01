-- Create secure transcript deletion function with cascading delete
CREATE OR REPLACE FUNCTION public.delete_transcript_cascade(p_transcript_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  transcript_owner uuid;
  is_admin boolean;
  deleted_count integer := 0;
BEGIN
  -- Check if user is admin
  is_admin := public.has_role(p_user_id, 'admin');
  
  -- Get transcript owner
  SELECT user_id INTO transcript_owner
  FROM public.transcripts
  WHERE id = p_transcript_id;
  
  -- Validate transcript exists
  IF transcript_owner IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transcript not found'
    );
  END IF;
  
  -- Validate user has permission (owner or admin)
  IF transcript_owner != p_user_id AND NOT is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied: You do not own this transcript'
    );
  END IF;
  
  -- Begin cascading deletion
  -- Delete conversation analysis
  DELETE FROM public.conversation_analysis WHERE transcript_id = p_transcript_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete queue assignments
  DELETE FROM public.queue_assignments WHERE transcript_id = p_transcript_id;
  
  -- Delete external transcript queue entries
  DELETE FROM public.external_transcript_queue WHERE transcript_id = p_transcript_id;
  
  -- Delete transcript progress
  DELETE FROM public.transcript_progress WHERE transcript_id = p_transcript_id;
  
  -- Delete webhook delivery logs
  DELETE FROM public.webhook_delivery_log WHERE transcript_id = p_transcript_id;
  
  -- Delete deal heat history
  DELETE FROM public.deal_heat_history WHERE analysis_id IN (
    SELECT id FROM public.conversation_analysis WHERE transcript_id = p_transcript_id
  );
  
  -- Finally, delete the transcript itself
  DELETE FROM public.transcripts WHERE id = p_transcript_id;
  
  -- Log the deletion for audit purposes
  INSERT INTO public.gdpr_audit_log (
    event_type,
    user_id,
    admin_id,
    details,
    status,
    legal_basis,
    timestamp
  ) VALUES (
    'transcript_deleted',
    transcript_owner,
    CASE WHEN is_admin THEN p_user_id ELSE NULL END,
    jsonb_build_object(
      'transcript_id', p_transcript_id,
      'deleted_by', p_user_id,
      'is_admin_delete', is_admin,
      'analysis_records_deleted', deleted_count,
      'deletion_timestamp', now()
    ),
    'completed',
    'User request - Right to erasure (GDPR Article 17)',
    now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Transcript and all related data deleted successfully',
    'transcript_id', p_transcript_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the failed attempt
    INSERT INTO public.gdpr_audit_log (
      event_type,
      user_id,
      admin_id,
      details,
      status,
      legal_basis,
      timestamp
    ) VALUES (
      'transcript_deletion_failed',
      transcript_owner,
      CASE WHEN is_admin THEN p_user_id ELSE NULL END,
      jsonb_build_object(
        'transcript_id', p_transcript_id,
        'error', SQLERRM,
        'failure_timestamp', now()
      ),
      'failed',
      'User request - Right to erasure (GDPR Article 17)',
      now()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Deletion failed: ' || SQLERRM
    );
END;
$$;