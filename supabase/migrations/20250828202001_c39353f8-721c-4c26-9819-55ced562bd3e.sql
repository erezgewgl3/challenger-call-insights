-- Fix recursive RLS policy on users table
-- The current policy causes infinite recursion by querying the same table it's applied to

-- Drop the existing recursive policy
DROP POLICY IF EXISTS "users_unified_access" ON public.users;

-- Create a new policy using the existing security definer function to avoid recursion
CREATE POLICY "users_unified_access" ON public.users
FOR ALL 
USING (
  (auth.uid() = id) OR 
  (public.get_current_user_role() = 'admin')
);