-- Fix hash_token function to use correct SHA256 hashing
CREATE OR REPLACE FUNCTION public.hash_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(sha256(token::bytea), 'hex');
END;
$$;