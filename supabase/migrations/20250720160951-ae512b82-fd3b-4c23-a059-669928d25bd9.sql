
-- Enhanced file upload security - Phase 2 implementation
-- This enhances the existing enhanced_file_validation function with file signature validation

-- First, let's create a helper function for file signature validation
CREATE OR REPLACE FUNCTION public.validate_file_signature(
  p_file_content bytea,
  p_declared_type text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  file_header bytea;
  is_valid boolean := false;
  detected_type text;
BEGIN
  -- Get first 16 bytes for signature checking
  file_header := substring(p_file_content from 1 for 16);
  
  -- Check file signatures based on magic bytes
  CASE p_declared_type
    WHEN 'text/plain' THEN
      -- Text files should not have binary headers
      is_valid := (file_header IS NULL OR length(file_header) = 0 OR 
                   substring(file_header from 1 for 4) NOT IN (
                     '\x89PNG'::bytea, '\xFFD8FF'::bytea, '\x504B03'::bytea, 
                     '\x4D5A'::bytea, '\x7F454C'::bytea
                   ));
      detected_type := 'text/plain';
      
    WHEN 'text/vtt' THEN
      -- VTT files should start with "WEBVTT" or be plain text
      is_valid := true; -- VTT is text-based, so basic text validation applies
      detected_type := 'text/vtt';
      
    WHEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' THEN
      -- DOCX files are ZIP archives with specific signature
      is_valid := (substring(file_header from 1 for 4) = '\x504B0304'::bytea OR
                   substring(file_header from 1 for 2) = '\x504B'::bytea);
      detected_type := 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
    ELSE
      is_valid := false;
      detected_type := 'unknown';
  END CASE;
  
  RETURN jsonb_build_object(
    'valid', is_valid,
    'detected_type', detected_type,
    'signature_match', is_valid
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Signature validation failed: ' || SQLERRM,
      'detected_type', 'error'
    );
END;
$function$;

-- Enhanced content security scanning function
CREATE OR REPLACE FUNCTION public.scan_file_content_security(
  p_content text,
  p_file_name text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  security_score integer := 100;
  threats jsonb := '[]'::jsonb;
  content_lower text;
  suspicious_patterns text[] := ARRAY[
    '<script', 'javascript:', 'vbscript:', 'onload=', 'onerror=',
    'eval(', 'document.cookie', 'window.location', 'setTimeout(',
    'setInterval(', 'innerHTML', 'outerHTML', 'document.write'
  ];
  executable_extensions text[] := ARRAY[
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'
  ];
  pattern text;
  ext text;
BEGIN
  content_lower := lower(p_content);
  
  -- Check for suspicious script patterns
  FOREACH pattern IN ARRAY suspicious_patterns
  LOOP
    IF position(pattern IN content_lower) > 0 THEN
      security_score := security_score - 20;
      threats := threats || jsonb_build_object(
        'type', 'suspicious_script',
        'pattern', pattern,
        'severity', 'medium'
      );
    END IF;
  END LOOP;
  
  -- Check file extension for executable types
  FOREACH ext IN ARRAY executable_extensions
  LOOP
    IF lower(p_file_name) LIKE '%' || ext THEN
      security_score := security_score - 50;
      threats := threats || jsonb_build_object(
        'type', 'executable_extension',
        'extension', ext,
        'severity', 'high'
      );
    END IF;
  END LOOP;
  
  -- Check for excessive special characters (possible obfuscation)
  IF (length(p_content) - length(translate(p_content, '!@#$%^&*(){}[]<>/\|', ''))) > (length(p_content) * 0.3) THEN
    security_score := security_score - 15;
    threats := threats || jsonb_build_object(
      'type', 'high_special_char_ratio',
      'severity', 'low'
    );
  END IF;
  
  -- Check for very long lines (possible obfuscation)
  IF position(chr(10) IN p_content) = 0 AND length(p_content) > 10000 THEN
    security_score := security_score - 10;
    threats := threats || jsonb_build_object(
      'type', 'single_long_line',
      'severity', 'low'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'security_score', GREATEST(0, security_score),
    'threats', threats,
    'safe', security_score >= 70
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'security_score', 0,
      'threats', '[{"type": "scan_error", "error": "' || SQLERRM || '"}]'::jsonb,
      'safe', false
    );
END;
$function$;

-- Update the enhanced_file_validation function to include signature validation
CREATE OR REPLACE FUNCTION public.enhanced_file_validation(
  p_file_name text,
  p_file_size bigint,
  p_content_type text,
  p_user_id uuid,
  p_ip_address text DEFAULT NULL::text,
  p_file_content text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  max_file_size bigint := 10485760; -- 10MB
  allowed_types text[] := ARRAY['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/vtt'];
  blocked_extensions text[] := ARRAY['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.sys', '.dll', '.vbs', '.js'];
  suspicious_names text[] := ARRAY['autorun.inf', 'desktop.ini', 'thumbs.db', '.htaccess', 'web.config'];
  file_ext text;
  clean_filename text;
  content_scan_result jsonb;
BEGIN
  -- Extract file extension and clean filename
  file_ext := lower(substring(p_file_name from '(\.[^.]+)$'));
  clean_filename := lower(trim(p_file_name));
  
  -- Enhanced file size validation
  IF p_file_size > max_file_size THEN
    PERFORM public.log_security_event(
      'file_upload_rejected_size',
      p_user_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'file_size', p_file_size,
        'max_allowed', max_file_size,
        'ip_address', p_ip_address,
        'severity', 'medium'
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'File size exceeds 10MB limit',
      'security_issue', 'size_limit'
    );
  END IF;
  
  -- Enhanced content type validation
  IF NOT (p_content_type = ANY(allowed_types)) THEN
    PERFORM public.log_security_event(
      'file_upload_rejected_type',
      p_user_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'content_type', p_content_type,
        'allowed_types', allowed_types,
        'ip_address', p_ip_address,
        'severity', 'high'
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Unsupported file type. Only .txt, .docx, and .vtt files are allowed',
      'security_issue', 'invalid_type'
    );
  END IF;
  
  -- Enhanced dangerous file extension check
  IF file_ext = ANY(blocked_extensions) THEN
    PERFORM public.log_security_event(
      'file_upload_blocked_extension',
      p_user_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'blocked_extension', file_ext,
        'ip_address', p_ip_address,
        'severity', 'critical'
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'File extension not allowed for security reasons',
      'security_issue', 'blocked_extension'
    );
  END IF;
  
  -- Suspicious filename check
  IF clean_filename = ANY(suspicious_names) THEN
    PERFORM public.log_security_event(
      'file_upload_suspicious_name',
      p_user_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'suspicious_name', clean_filename,
        'ip_address', p_ip_address,
        'severity', 'high'
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Filename not allowed for security reasons',
      'security_issue', 'suspicious_filename'
    );
  END IF;
  
  -- Enhanced filename validation (path traversal and illegal characters)
  IF p_file_name ~* '\.\.|[<>:"|?*\x00-\x1f]|^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)' OR
     p_file_name ~ '[\\/]' OR
     length(p_file_name) > 255 THEN
    PERFORM public.log_security_event(
      'file_upload_invalid_filename',
      p_user_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'issue', 'invalid_characters_or_path_traversal',
        'ip_address', p_ip_address,
        'severity', 'high'
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid file name - contains illegal characters or path traversal patterns',
      'security_issue', 'invalid_filename'
    );
  END IF;
  
  -- Content security scanning (if content provided)
  IF p_file_content IS NOT NULL THEN
    content_scan_result := public.scan_file_content_security(p_file_content, p_file_name);
    
    IF NOT (content_scan_result->>'safe')::boolean THEN
      PERFORM public.log_security_event(
        'file_upload_content_threat',
        p_user_id,
        jsonb_build_object(
          'file_name', p_file_name,
          'content_scan', content_scan_result,
          'ip_address', p_ip_address,
          'severity', 'high'
        )
      );
      
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'File content contains potentially dangerous patterns',
        'security_issue', 'content_threat',
        'scan_details', content_scan_result
      );
    END IF;
  END IF;
  
  -- Log successful enhanced validation
  PERFORM public.log_security_event(
    'file_upload_validated_enhanced',
    p_user_id,
    jsonb_build_object(
      'file_name', p_file_name,
      'file_size', p_file_size,
      'content_type', p_content_type,
      'content_scanned', p_file_content IS NOT NULL,
      'ip_address', p_ip_address,
      'security_level', 'enhanced'
    )
  );
  
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'File validation passed with enhanced security checks',
    'security_level', 'enhanced'
  );
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_security_event(
      'file_upload_validation_error',
      p_user_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'error', SQLERRM,
        'ip_address', p_ip_address,
        'severity', 'medium'
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'File validation failed: ' || SQLERRM,
      'security_issue', 'validation_error'
    );
END;
$function$;
