-- Fix infinite recursion in user_roles RLS policies
-- The issue is that the RLS policies call has_role(), which queries user_roles,
-- which triggers RLS policies again, causing infinite recursion.

-- Drop the problematic policies
DROP POLICY IF EXISTS "user_roles_admin_full_access" ON user_roles;
DROP POLICY IF EXISTS "user_roles_read_own_or_admin" ON user_roles;

-- Recreate policies that don't cause recursion
-- Users can read their own roles
CREATE POLICY "user_roles_read_own"
ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can do everything - but we check the users table directly to avoid recursion
CREATE POLICY "user_roles_admin_all"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);