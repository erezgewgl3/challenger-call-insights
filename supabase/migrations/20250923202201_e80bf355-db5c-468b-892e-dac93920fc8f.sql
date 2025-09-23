-- Create secure RPC function for admin user statistics
CREATE OR REPLACE FUNCTION public.get_admin_user_statistics()
RETURNS TABLE(
  id uuid,
  email text,
  role user_role,
  status user_status,
  created_at timestamptz,
  last_login timestamptz,
  owned_transcript_count bigint,
  assigned_transcript_count bigint,
  account_count bigint,
  pending_deletion boolean,
  deletion_scheduled_for timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validate that the calling user is an admin
  IF public.get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Log the admin access for audit purposes
  PERFORM public.log_security_event(
    'admin_user_statistics_accessed',
    auth.uid(),
    jsonb_build_object(
      'action', 'get_admin_user_statistics',
      'timestamp', now(),
      'admin_id', auth.uid()
    )
  );
  
  -- Return user statistics with optimized queries
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.role,
    u.status,
    u.created_at,
    u.last_login,
    COALESCE(owned_transcripts.count, 0) as owned_transcript_count,
    COALESCE(assigned_transcripts.count, 0) as assigned_transcript_count,
    COALESCE(user_accounts.count, 0) as account_count,
    CASE WHEN dr.user_id IS NOT NULL THEN true ELSE false END as pending_deletion,
    dr.scheduled_for as deletion_scheduled_for
  FROM public.users u
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM public.transcripts
    WHERE user_id IS NOT NULL
    GROUP BY user_id
  ) owned_transcripts ON u.id = owned_transcripts.user_id
  LEFT JOIN (
    SELECT assigned_user_id, COUNT(*) as count
    FROM public.transcripts
    WHERE assigned_user_id IS NOT NULL
    GROUP BY assigned_user_id
  ) assigned_transcripts ON u.id = assigned_transcripts.assigned_user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM public.accounts
    WHERE user_id IS NOT NULL
    GROUP BY user_id
  ) user_accounts ON u.id = user_accounts.user_id
  LEFT JOIN (
    SELECT DISTINCT user_id, scheduled_for
    FROM public.deletion_requests
    WHERE status = 'pending'
  ) dr ON u.id = dr.user_id
  ORDER BY u.created_at DESC;
END;
$$;