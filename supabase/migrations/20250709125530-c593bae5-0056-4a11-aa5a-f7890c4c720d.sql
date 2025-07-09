-- Add policy allowing admins to update any user record
CREATE POLICY "Admins can update all users" 
ON public.users 
FOR UPDATE 
USING (get_current_user_role() = 'admin'::text);