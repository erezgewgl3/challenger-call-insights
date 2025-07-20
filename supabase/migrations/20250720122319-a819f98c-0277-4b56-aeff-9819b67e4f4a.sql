
-- Fix hash_token function to use fully qualified digest function from extensions schema
-- This avoids search_path issues while maintaining security
CREATE OR REPLACE FUNCTION public.hash_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Use fully qualified function name to avoid search_path issues
  -- This uses the correct digest(text, text) signature
  RETURN encode(extensions.digest(token, 'sha256'), 'hex');
EXCEPTION
  WHEN OTHERS THEN
    -- Log error for debugging while maintaining security
    RAISE EXCEPTION 'Token hashing failed: %', SQLERRM;
END;
$$;
