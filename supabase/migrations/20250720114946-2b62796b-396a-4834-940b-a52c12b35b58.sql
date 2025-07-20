
-- Enable pgcrypto extension for cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix hash_token function to use pgcrypto's digest function properly
CREATE OR REPLACE FUNCTION public.hash_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN encode(digest(token::bytea, 'sha256'), 'hex');
END;
$$;
