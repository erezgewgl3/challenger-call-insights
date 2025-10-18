-- Fix integration_framework_get_connection to return complete connection data
-- This restores the function to return all fields from integration_connections table

CREATE OR REPLACE FUNCTION public.integration_framework_get_connection(
  user_uuid UUID,
  integration_type_param TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  connection_data JSONB;
BEGIN
  -- Authentication check
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Authorization check (user can view their own connection or admin can view any)
  IF caller != user_uuid AND NOT public.has_role(caller, 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get complete connection data (all fields from integration_connections)
  SELECT to_jsonb(ic.*) INTO connection_data
  FROM public.integration_connections ic
  WHERE ic.user_id = user_uuid
    AND ic.integration_type = integration_type_param
  ORDER BY ic.created_at DESC
  LIMIT 1;

  -- Return not found if no connection exists
  IF connection_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'data', jsonb_build_object('connection_status', 'not_found')
    );
  END IF;

  -- Return full connection data including id, configuration, etc.
  RETURN jsonb_build_object(
    'status', 'success',
    'data', connection_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;