CREATE OR REPLACE FUNCTION public.assign_transcript_to_user(
  transcript_uuid UUID,
  user_email TEXT,
  assignment_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  target_user_id UUID;
  assignment_id UUID;
  result JSONB;
BEGIN
  -- Look up user by email
  SELECT public.lookup_user_by_email(user_email) INTO target_user_id;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found',
      'email', user_email
    );
  END IF;
  
  -- Update transcript assignment (removed updated_at reference)
  UPDATE public.transcripts 
  SET assigned_user_id = target_user_id
  WHERE id = transcript_uuid;
  
  -- Create assignment record
  INSERT INTO public.queue_assignments (transcript_id, assigned_to, notes)
  VALUES (transcript_uuid, target_user_id, assignment_notes)
  RETURNING id INTO assignment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', assignment_id,
    'assigned_to', target_user_id,
    'email', user_email
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';