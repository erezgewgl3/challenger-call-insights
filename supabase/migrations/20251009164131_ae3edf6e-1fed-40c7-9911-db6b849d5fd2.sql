-- Fix RLS policies for users table to prevent public access to email addresses
-- Drop existing policy
DROP POLICY IF EXISTS "users_secure_access" ON public.users;

-- Create separate restrictive policies for different operations

-- SELECT policy: Users can only see their own data, admins can see all
CREATE POLICY "users_select_own_or_admin"
ON public.users
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- INSERT policy: Only admins can insert (normal user creation goes through triggers)
CREATE POLICY "users_insert_admin_only"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- UPDATE policy: Users can update their own data, admins can update all
CREATE POLICY "users_update_own_or_admin"
ON public.users
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = id) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (auth.uid() = id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- DELETE policy: Only admins can delete
CREATE POLICY "users_delete_admin_only"
ON public.users
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Verify RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (prevents bypassing RLS as owner)
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;