-- Phase 4: Clean up duplicate RLS policies to improve security clarity

-- Remove duplicate policies on accounts table (keeping the most appropriate one)
DROP POLICY IF EXISTS "Users own accounts" ON accounts;
DROP POLICY IF EXISTS "Users own their accounts" ON accounts;

-- Keep only: "Admins can view all accounts" and create one clear user policy
CREATE POLICY "Users manage their own accounts" ON accounts
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Clean up duplicate policies on transcripts table  
DROP POLICY IF EXISTS "Users own transcripts" ON transcripts;

-- Keep: "Admins can view all transcripts" and "Users own their transcripts"

-- Clean up duplicate policies on conversation_analysis table
DROP POLICY IF EXISTS "Users see own analysis" ON conversation_analysis;

-- Keep: "Admins can view all analysis" and "Users see analysis for their transcripts"

-- Add comprehensive security logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Log security events for monitoring
  INSERT INTO public.gdpr_audit_log (
    event_type,
    user_id,
    admin_id,
    details,
    status,
    legal_basis,
    timestamp
  ) VALUES (
    p_event_type,
    p_user_id,
    auth.uid(),
    p_details || jsonb_build_object(
      'ip_address', p_ip_address,
      'user_agent', p_user_agent,
      'timestamp', now()
    ),
    'completed',
    'Security monitoring',
    now()
  );
  
  -- Also log to console for immediate visibility
  RAISE NOTICE 'SECURITY_EVENT: % for user % at %', p_event_type, p_user_id, now();
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail operations due to logging errors
    RAISE WARNING 'Failed to log security event: %', SQLERRM;
END;
$function$;

-- Add function to validate file uploads securely
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  p_file_name text,
  p_file_size bigint,
  p_content_type text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  allowed_types text[] := ARRAY['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/vtt'];
  max_size_bytes bigint := 10485760; -- 10MB
BEGIN
  -- File size validation
  IF p_file_size > max_size_bytes THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'File size exceeds 10MB limit'
    );
  END IF;
  
  -- Content type validation
  IF NOT (p_content_type = ANY(allowed_types)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid file type. Only .txt, .docx, and .vtt files are allowed'
    );
  END IF;
  
  -- File name validation (prevent path traversal)
  IF p_file_name ~* '\.\.|[<>:"|?*]|^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid file name'
    );
  END IF;
  
  -- Log successful validation
  PERFORM public.log_security_event(
    'file_upload_validated',
    p_user_id,
    jsonb_build_object(
      'file_name', p_file_name,
      'file_size', p_file_size,
      'content_type', p_content_type
    )
  );
  
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'File validation passed'
  );
END;
$function$;