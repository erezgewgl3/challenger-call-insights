-- Step 1: Create the user_roles table using the existing user_role enum
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Step 2: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policy for user_roles (admins can manage, users can view their own)
CREATE POLICY "user_roles_read_own_or_admin"
ON public.user_roles
FOR SELECT
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
);

CREATE POLICY "user_roles_admin_full_access"
ON public.user_roles
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
);

-- Step 4: Migrate existing roles from users table to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, role
FROM public.users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 5: Create security definer function to check roles (using user_role enum)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 6: Update the users table RLS policy to use the new secure function
DROP POLICY IF EXISTS "users_unified_access" ON public.users;

CREATE POLICY "users_secure_access"
ON public.users
FOR ALL
USING (
    -- Users can access their own record
    auth.uid() = id 
    OR 
    -- Admins can access all records
    public.has_role(auth.uid(), 'admin')
);

-- Step 7: Update get_current_user_role to use the new user_roles table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Query the user_roles table instead of users table to avoid recursion
  SELECT role::text INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'sales_user' THEN 2
      ELSE 3
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'anonymous');
END;
$$;

-- Step 8: Add helpful comment
COMMENT ON TABLE public.user_roles IS 'Stores user roles in a separate table to prevent privilege escalation attacks. This follows security best practices by keeping role checks independent from the users table RLS policies.';