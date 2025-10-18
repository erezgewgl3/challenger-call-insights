-- Fix public.vault_store_secret to correctly call vault.create_secret
-- The vault function expects TEXT for the secret, not JSONB, and returns UUID directly
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
  -- vault.create_secret expects (TEXT, TEXT, TEXT) and returns UUID directly
  SELECT vault.create_secret(
    secret_json::text,  -- Convert JSONB to TEXT
    new_name,
    new_description
  ) INTO secret_id;

  RETURN secret_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'vault_store_secret failed: %', SQLERRM;
END;
$$;

-- Fix public.vault_update_secret to correctly call vault.update_secret
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
  -- vault.update_secret expects (UUID, TEXT)
  PERFORM vault.update_secret(
    secret_id,
    secret_json::text
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'vault_update_secret failed: %', SQLERRM;
END;
$$;