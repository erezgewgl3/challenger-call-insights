-- Add missing integration registry function
CREATE OR REPLACE FUNCTION public.get_integration_registry()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN jsonb_build_object(
    'integrations', jsonb_build_object(
      'zoom', jsonb_build_object(
        'id', 'zoom',
        'name', 'Zoom',
        'description', 'Video conferencing platform',
        'category', 'communication',
        'status', 'active',
        'capabilities', ARRAY['webhook', 'transcript_processing'],
        'stats', jsonb_build_object('total_connections', 0, 'active_connections', 0)
      ),
      'zapier', jsonb_build_object(
        'id', 'zapier', 
        'name', 'Zapier',
        'description', 'Automation platform',
        'category', 'other',
        'status', 'active',
        'capabilities', ARRAY['webhook', 'automation'],
        'stats', jsonb_build_object('total_connections', 0, 'active_connections', 0)
      )
    ),
    'system_stats', jsonb_build_object(
      'total_connections', 0,
      'active_connections', 0,
      'total_users', 0,
      'webhook_success_rate', 100
    )
  );
END;
$$;