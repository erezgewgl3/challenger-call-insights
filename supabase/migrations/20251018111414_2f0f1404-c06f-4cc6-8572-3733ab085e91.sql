-- Public wrapper RPCs for Supabase Vault + Connection Status RPC

-- 1) Store secret wrapper
CREATE OR REPLACE FUNCTION public.vault_store_secret(
  new_name TEXT,
  new_description TEXT,
  secret_json JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_id UUID;
BEGIN
  SELECT vault.create_secret(secret := secret_json, name := new_name, description := new_description)
  INTO secret_id;

  RETURN secret_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'vault_store_secret failed: %', SQLERRM;
END;
$$;

-- 2) Update secret wrapper
CREATE OR REPLACE FUNCTION public.vault_update_secret(
  secret_id UUID,
  secret_json JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  PERFORM vault.update_secret(secret_id := secret_id, secret := secret_json);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'vault_update_secret failed: %', SQLERRM;
END;
$$;

-- 3) Get secret wrapper
CREATE OR REPLACE FUNCTION public.vault_get_secret(
  secret_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  payload JSONB;
BEGIN
  SELECT decrypted_secret::jsonb
  INTO payload
  FROM vault.decrypted_secrets
  WHERE id = secret_id;

  IF payload IS NULL THEN
    RAISE EXCEPTION 'No secret found for %', secret_id;
  END IF;

  RETURN payload;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'vault_get_secret failed: %', SQLERRM;
END;
$$;

-- 4) Delete secret wrapper
CREATE OR REPLACE FUNCTION public.vault_delete_secret(
  secret_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  -- Prefer native function if available
  BEGIN
    PERFORM vault.delete_secret(secret_id := secret_id);
  EXCEPTION
    WHEN undefined_function THEN
      -- Fallback to direct delete if function not available
      DELETE FROM vault.secrets WHERE id = secret_id;
  END;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'vault_delete_secret failed: %', SQLERRM;
END;
$$;

-- 5) Integration connection status RPC used by the frontend
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
  status_text TEXT;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF caller != user_uuid AND NOT public.has_role(caller, 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT ic.connection_status
  INTO status_text
  FROM public.integration_connections ic
  WHERE ic.user_id = user_uuid
    AND ic.integration_type = integration_type_param
  ORDER BY ic.created_at DESC
  LIMIT 1;

  IF status_text IS NULL THEN
    RETURN jsonb_build_object('status','success','data', jsonb_build_object('connection_status','not_found'));
  END IF;

  RETURN jsonb_build_object('status','success','data', jsonb_build_object('connection_status', status_text));
END;
$$;