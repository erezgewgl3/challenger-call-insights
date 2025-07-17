-- Fix ambiguous column reference error in integration_framework_update_config function
CREATE OR REPLACE FUNCTION public.integration_framework_update_config(
  user_uuid uuid, 
  integration_type_param text, 
  config_key_param text, 
  config_value jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  config_data jsonb;
BEGIN
  INSERT INTO integration_configs (
    user_id,
    integration_type,
    config_key,
    config_value
  ) VALUES (
    user_uuid,
    integration_type_param,
    config_key_param,
    config_value
  )
  ON CONFLICT (user_id, integration_type, config_key)
  DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = now();
  
  SELECT to_jsonb(ic.*) INTO config_data
  FROM integration_configs ic
  WHERE ic.user_id = user_uuid 
    AND ic.integration_type = integration_type_param
    AND ic.config_key = config_key_param;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', config_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$function$;