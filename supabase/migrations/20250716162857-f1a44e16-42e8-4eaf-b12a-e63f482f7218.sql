-- Integration Framework Database Helper Functions
-- These functions support the integration Edge Functions created in Prompt 5

-- Connection Management Functions

CREATE OR REPLACE FUNCTION integration_framework_get_connection(user_uuid uuid, integration_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  connection_data jsonb;
BEGIN
  SELECT to_jsonb(ic.*) INTO connection_data
  FROM integration_connections ic
  WHERE ic.user_id = user_uuid 
    AND ic.integration_type = integration_type
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
$$;

CREATE OR REPLACE FUNCTION integration_framework_create_connection(user_uuid uuid, integration_type text, connection_name text, credentials jsonb, configuration jsonb DEFAULT '{}')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_connection_id uuid;
  connection_data jsonb;
BEGIN
  INSERT INTO integration_connections (
    user_id,
    integration_type,
    connection_name,
    credentials,
    configuration,
    connection_status
  ) VALUES (
    user_uuid,
    integration_type,
    connection_name,
    credentials,
    configuration,
    'active'
  ) RETURNING id INTO new_connection_id;
  
  SELECT to_jsonb(ic.*) INTO connection_data
  FROM integration_connections ic
  WHERE ic.id = new_connection_id;
  
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

CREATE OR REPLACE FUNCTION integration_framework_update_connection(connection_id uuid, updates jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  connection_data jsonb;
BEGIN
  UPDATE integration_connections 
  SET 
    connection_name = COALESCE((updates->>'connection_name')::text, connection_name),
    credentials = COALESCE((updates->'credentials')::jsonb, credentials),
    configuration = COALESCE((updates->'configuration')::jsonb, configuration),
    connection_status = COALESCE((updates->>'connection_status')::text, connection_status),
    last_sync_at = COALESCE((updates->>'last_sync_at')::timestamptz, last_sync_at),
    updated_at = now()
  WHERE id = connection_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
  SELECT to_jsonb(ic.*) INTO connection_data
  FROM integration_connections ic
  WHERE ic.id = connection_id;
  
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

CREATE OR REPLACE FUNCTION integration_framework_delete_connection(connection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE integration_connections 
  SET connection_status = 'disconnected', updated_at = now()
  WHERE id = connection_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'message', 'Connection not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Connection disconnected successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;

-- Status and Health Checking Functions

CREATE OR REPLACE FUNCTION integration_framework_get_connection_status(user_uuid uuid, integration_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  status_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'integration_type', ic.integration_type,
    'connection_name', ic.connection_name,
    'status', ic.connection_status,
    'last_sync_at', ic.last_sync_at,
    'created_at', ic.created_at,
    'updated_at', ic.updated_at
  ) INTO status_data
  FROM integration_connections ic
  WHERE ic.user_id = user_uuid 
    AND ic.integration_type = integration_type;
  
  IF status_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', status_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;

CREATE OR REPLACE FUNCTION integration_framework_get_connection_health(connection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  health_data jsonb;
  recent_sync_count integer;
  recent_error_count integer;
BEGIN
  -- Get connection details
  SELECT jsonb_build_object(
    'connection_id', ic.id,
    'integration_type', ic.integration_type,
    'connection_name', ic.connection_name,
    'status', ic.connection_status,
    'last_sync_at', ic.last_sync_at
  ) INTO health_data
  FROM integration_connections ic
  WHERE ic.id = connection_id;
  
  IF health_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
  -- Get recent sync statistics
  SELECT COUNT(*) INTO recent_sync_count
  FROM integration_sync_operations iso
  WHERE iso.connection_id = connection_id
    AND iso.created_at > now() - interval '24 hours';
  
  SELECT COUNT(*) INTO recent_error_count
  FROM integration_sync_operations iso
  WHERE iso.connection_id = connection_id
    AND iso.operation_status = 'failed'
    AND iso.created_at > now() - interval '24 hours';
  
  -- Add health metrics to response
  health_data := health_data || jsonb_build_object(
    'recent_syncs_24h', recent_sync_count,
    'recent_errors_24h', recent_error_count,
    'health_score', CASE 
      WHEN recent_error_count = 0 THEN 'excellent'
      WHEN recent_error_count <= recent_sync_count * 0.1 THEN 'good'
      WHEN recent_error_count <= recent_sync_count * 0.3 THEN 'warning'
      ELSE 'critical'
    END
  );
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', health_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;

CREATE OR REPLACE FUNCTION integration_framework_update_connection_status(connection_id uuid, new_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE integration_connections 
  SET connection_status = new_status, updated_at = now()
  WHERE id = connection_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'message', 'Connection not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Connection status updated successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;

-- Sync Operations Functions

CREATE OR REPLACE FUNCTION integration_framework_start_sync(connection_id uuid, operation_type text, operation_data jsonb DEFAULT '{}')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sync_id uuid;
  sync_data jsonb;
BEGIN
  INSERT INTO integration_sync_operations (
    connection_id,
    operation_type,
    operation_data,
    operation_status,
    started_at
  ) VALUES (
    connection_id,
    operation_type,
    operation_data,
    'running',
    now()
  ) RETURNING id INTO sync_id;
  
  SELECT to_jsonb(iso.*) INTO sync_data
  FROM integration_sync_operations iso
  WHERE iso.id = sync_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', sync_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;

CREATE OR REPLACE FUNCTION integration_framework_complete_sync(sync_id uuid, result_data jsonb, sync_status text DEFAULT 'completed')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sync_data jsonb;
BEGIN
  UPDATE integration_sync_operations 
  SET 
    operation_status = sync_status,
    operation_data = operation_data || result_data,
    completed_at = now(),
    progress_percentage = 100
  WHERE id = sync_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'message', 'Sync operation not found'
    );
  END IF;
  
  SELECT to_jsonb(iso.*) INTO sync_data
  FROM integration_sync_operations iso
  WHERE iso.id = sync_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', sync_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;

CREATE OR REPLACE FUNCTION integration_framework_get_sync_status(sync_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sync_data jsonb;
BEGIN
  SELECT to_jsonb(iso.*) INTO sync_data
  FROM integration_sync_operations iso
  WHERE iso.id = sync_id;
  
  IF sync_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', sync_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;

-- Webhook Logging Functions

CREATE OR REPLACE FUNCTION integration_framework_log_webhook(connection_id uuid, webhook_event text, payload jsonb, headers jsonb DEFAULT '{}')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
  log_data jsonb;
BEGIN
  INSERT INTO integration_webhook_logs (
    connection_id,
    webhook_event,
    payload,
    headers,
    processing_status
  ) VALUES (
    connection_id,
    webhook_event,
    payload,
    headers,
    'pending'
  ) RETURNING id INTO log_id;
  
  SELECT to_jsonb(iwl.*) INTO log_data
  FROM integration_webhook_logs iwl
  WHERE iwl.id = log_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', log_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;

CREATE OR REPLACE FUNCTION integration_framework_get_webhook_logs(connection_id uuid, limit_count integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  logs_data jsonb;
BEGIN
  SELECT jsonb_agg(to_jsonb(iwl.*) ORDER BY iwl.created_at DESC) INTO logs_data
  FROM integration_webhook_logs iwl
  WHERE iwl.connection_id = connection_id
  LIMIT limit_count;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', COALESCE(logs_data, '[]'::jsonb)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;

-- Configuration Management Functions

CREATE OR REPLACE FUNCTION integration_framework_get_config(user_uuid uuid, integration_type text, config_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_data jsonb;
BEGIN
  SELECT ic.config_value INTO config_data
  FROM integration_configs ic
  WHERE ic.user_id = user_uuid 
    AND ic.integration_type = integration_type
    AND ic.config_key = config_key;
  
  IF config_data IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'data', null
    );
  END IF;
  
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
$$;

CREATE OR REPLACE FUNCTION integration_framework_update_config(user_uuid uuid, integration_type text, config_key text, config_value jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    integration_type,
    config_key,
    config_value
  )
  ON CONFLICT (user_id, integration_type, config_key)
  DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = now();
  
  SELECT to_jsonb(ic.*) INTO config_data
  FROM integration_configs ic
  WHERE ic.user_id = user_uuid 
    AND ic.integration_type = integration_type
    AND ic.config_key = config_key;
  
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
$$;

-- Analytics and Monitoring Functions

CREATE OR REPLACE FUNCTION integration_framework_get_user_stats(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats_data jsonb;
  connection_count integer;
  active_sync_count integer;
  total_sync_count integer;
  error_rate numeric;
BEGIN
  -- Get connection statistics
  SELECT COUNT(*) INTO connection_count
  FROM integration_connections ic
  WHERE ic.user_id = user_uuid AND ic.connection_status = 'active';
  
  -- Get sync statistics
  SELECT COUNT(*) INTO active_sync_count
  FROM integration_sync_operations iso
  JOIN integration_connections ic ON iso.connection_id = ic.id
  WHERE ic.user_id = user_uuid AND iso.operation_status = 'running';
  
  SELECT COUNT(*) INTO total_sync_count
  FROM integration_sync_operations iso
  JOIN integration_connections ic ON iso.connection_id = ic.id
  WHERE ic.user_id = user_uuid AND iso.created_at > now() - interval '30 days';
  
  -- Calculate error rate
  SELECT 
    CASE 
      WHEN total_sync_count = 0 THEN 0
      ELSE ROUND(
        (COUNT(CASE WHEN iso.operation_status = 'failed' THEN 1 END)::numeric / total_sync_count) * 100, 2
      )
    END INTO error_rate
  FROM integration_sync_operations iso
  JOIN integration_connections ic ON iso.connection_id = ic.id
  WHERE ic.user_id = user_uuid AND iso.created_at > now() - interval '30 days';
  
  stats_data := jsonb_build_object(
    'active_connections', connection_count,
    'active_syncs', active_sync_count,
    'total_syncs_30d', total_sync_count,
    'error_rate_30d', COALESCE(error_rate, 0),
    'last_updated', now()
  );
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', stats_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;

CREATE OR REPLACE FUNCTION integration_framework_get_system_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats_data jsonb;
  total_connections integer;
  total_users integer;
  total_syncs_today integer;
  total_webhooks_today integer;
BEGIN
  -- Get system-wide statistics
  SELECT COUNT(*) INTO total_connections
  FROM integration_connections
  WHERE connection_status = 'active';
  
  SELECT COUNT(DISTINCT user_id) INTO total_users
  FROM integration_connections;
  
  SELECT COUNT(*) INTO total_syncs_today
  FROM integration_sync_operations
  WHERE created_at > current_date;
  
  SELECT COUNT(*) INTO total_webhooks_today
  FROM integration_webhook_logs
  WHERE created_at > current_date;
  
  stats_data := jsonb_build_object(
    'total_active_connections', total_connections,
    'total_users_with_integrations', total_users,
    'total_syncs_today', total_syncs_today,
    'total_webhooks_today', total_webhooks_today,
    'last_updated', now()
  );
  
  RETURN jsonb_build_object(
    'status', 'success',
    'data', stats_data
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM
    );
END;
$$;