-- Fix User Registration Bug - Complete Solution
-- Step 1: Create missing public.users record for erezgew@yahoo.com
INSERT INTO public.users (id, email, role, status, created_at)
VALUES (
  '0430d79d-1407-4ead-944e-14bcf65cc416',
  'erezgew@yahoo.com',
  'sales_user',
  'active',
  '2025-07-10 19:36:26.016377+00'::timestamptz
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Enhanced trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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
    -- Log the error but don't block auth.users creation
    RAISE WARNING 'Failed to create public.users record for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 3: Function to find and fix orphaned auth users
CREATE OR REPLACE FUNCTION public.fix_orphaned_auth_users()
RETURNS TABLE(fixed_user_id uuid, fixed_email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.users (id, email, role, status, created_at)
  SELECT 
    au.id,
    au.email,
    'sales_user'::user_role,
    'active'::user_status,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL
    AND au.email IS NOT NULL
    AND au.email_confirmed_at IS NOT NULL
  RETURNING id, email;
END;
$$;