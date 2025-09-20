-- Fix security issues by setting proper search_path for functions

-- Function to lookup user by email (with security fix)
CREATE OR REPLACE FUNCTION lookup_user_by_email(email_address TEXT)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id 
  FROM public.users 
  WHERE email = email_address;
  
  RETURN user_id;
END;
$$;

-- Function to assign transcript to user (with security fix)
CREATE OR REPLACE FUNCTION assign_transcript_to_user(
  transcript_uuid UUID,
  user_email TEXT,
  assignment_notes TEXT DEFAULT NULL
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
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
  
  -- Update transcript assignment
  UPDATE public.transcripts 
  SET assigned_user_id = target_user_id,
      updated_at = NOW()
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
$$;

-- Function to get queue summary for user (with security fix)
CREATE OR REPLACE FUNCTION get_user_queue_summary(user_uuid UUID)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  summary JSONB;
BEGIN
  WITH queue_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE processing_status = 'pending' AND user_id = user_uuid) as owned_pending,
      COUNT(*) FILTER (WHERE processing_status = 'pending' AND assigned_user_id = user_uuid) as assigned_pending,
      COUNT(*) FILTER (WHERE priority_level = 'urgent' AND (user_id = user_uuid OR assigned_user_id = user_uuid)) as urgent_count,
      COUNT(*) FILTER (WHERE (user_id = user_uuid OR assigned_user_id = user_uuid)) as total_count
    FROM public.transcripts
    WHERE user_id = user_uuid OR assigned_user_id = user_uuid
  )
  SELECT jsonb_build_object(
    'owned_pending', owned_pending,
    'assigned_pending', assigned_pending,
    'urgent_count', urgent_count,
    'total_count', total_count
  ) INTO summary
  FROM queue_stats;
  
  RETURN summary;
END;
$$;

-- Trigger function to update queue position (with security fix)
CREATE OR REPLACE FUNCTION update_queue_position()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.external_source != 'manual' AND NEW.processing_status = 'pending' THEN
    -- Add to external queue
    INSERT INTO public.external_transcript_queue (transcript_id, queue_status, webhook_payload)
    VALUES (NEW.id, 'pending', NEW.assignment_metadata);
    
    -- Set queue position based on priority
    UPDATE public.external_transcript_queue 
    SET queue_position = (
      SELECT COALESCE(MAX(queue_position), 0) + 1 
      FROM public.external_transcript_queue 
      WHERE queue_status IN ('pending', 'assigned')
    )
    WHERE transcript_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;