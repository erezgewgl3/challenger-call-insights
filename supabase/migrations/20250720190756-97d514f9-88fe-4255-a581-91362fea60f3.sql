
-- Fix the ambiguous column reference in integration_framework_get_connection function
DROP FUNCTION IF EXISTS public.integration_framework_get_connection(uuid, text);

CREATE OR REPLACE FUNCTION public.integration_framework_get_connection(
  user_uuid uuid, 
  integration_type_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  connection_data jsonb;
BEGIN
  SELECT to_jsonb(ic.*) INTO connection_data
  FROM public.integration_connections ic
  WHERE ic.user_id = user_uuid 
    AND ic.integration_type = integration_type_param
    AND ic.connection_status = 'active';
  
  IF connection_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
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
$function$;
