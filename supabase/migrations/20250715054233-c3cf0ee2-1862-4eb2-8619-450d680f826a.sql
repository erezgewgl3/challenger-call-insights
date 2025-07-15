-- Create registration failures tracking table
CREATE TABLE registration_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  error_message text NOT NULL,
  attempted_at timestamp with time zone DEFAULT now(),
  alert_sent boolean DEFAULT false,
  alert_sent_at timestamp with time zone,
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolution_method text
);

-- Create index for efficient querying
CREATE INDEX idx_registration_failures_alert_sent ON registration_failures(alert_sent, attempted_at);
CREATE INDEX idx_registration_failures_resolved ON registration_failures(resolved, attempted_at);

-- Enable RLS
ALTER TABLE registration_failures ENABLE ROW LEVEL SECURITY;

-- Only admins can access registration failures
CREATE POLICY "Only admins can manage registration failures" ON registration_failures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enhanced handle_new_user function with failure logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert into public.users with error handling
  INSERT INTO public.users (id, email, role, status, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    'sales_user',
    'active',
    NEW.created_at
  );
  
  -- Log successful creation for debugging
  RAISE NOTICE 'Successfully created public.users record for user: %', NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the failure to our tracking table
    INSERT INTO public.registration_failures (user_id, user_email, error_message)
    VALUES (NEW.id, NEW.email, SQLERRM);
    
    -- Log the error but don't block auth.users creation
    RAISE WARNING 'Failed to create public.users record for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;