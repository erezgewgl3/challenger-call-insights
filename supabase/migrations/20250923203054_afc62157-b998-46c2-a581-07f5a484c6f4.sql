-- Fix ambiguous status reference in get_admin_user_statistics()
-- Qualify status column in deletion_requests subquery and mark function STABLE for optimization

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
STABLE
SET search_path TO ''
AS $$
BEGIN
  -- Validate that the calling user is an admin
  IF public.get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Log the admin access for audit purposes (non-blocking on failure)
  PERFORM public.log_security_event(
    'admin_user_statistics_accessed',
    auth.uid(),
    jsonb_build_object(
      'action', 'get_admin_user_statistics',
      'timestamp', now(),
      'admin_id', auth.uid()
    )
  );
  
  -- Return user statistics with qualified column references
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.role,
    u.status,
    u.created_at,
    u.last_login,
    COALESCE(owned_transcripts.count, 0) AS owned_transcript_count,
    COALESCE(assigned_transcripts.count, 0) AS assigned_transcript_count,
    COALESCE(user_accounts.count, 0) AS account_count,
    CASE WHEN dr.user_id IS NOT NULL THEN true ELSE false END AS pending_deletion,
    dr.scheduled_for AS deletion_scheduled_for
  FROM public.users u
  LEFT JOIN (
    SELECT t.user_id, COUNT(*) AS count
    FROM public.transcripts t
    WHERE t.user_id IS NOT NULL
    GROUP BY t.user_id
  ) owned_transcripts ON u.id = owned_transcripts.user_id
  LEFT JOIN (
    SELECT t.assigned_user_id, COUNT(*) AS count
    FROM public.transcripts t
    WHERE t.assigned_user_id IS NOT NULL
    GROUP BY t.assigned_user_id
  ) assigned_transcripts ON u.id = assigned_transcripts.assigned_user_id
  LEFT JOIN (
    SELECT a.user_id, COUNT(*) AS count
    FROM public.accounts a
    WHERE a.user_id IS NOT NULL
    GROUP BY a.user_id
  ) user_accounts ON u.id = user_accounts.user_id
  LEFT JOIN (
    SELECT DISTINCT drq.user_id, drq.scheduled_for
    FROM public.deletion_requests drq
    WHERE drq.status = 'pending'
  ) dr ON u.id = dr.user_id
  ORDER BY u.created_at DESC;
END;
$$;