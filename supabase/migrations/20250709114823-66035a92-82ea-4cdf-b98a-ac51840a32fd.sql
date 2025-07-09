-- Fix RLS policy for deletion_requests table to allow proper admin insertions

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Admins can manage deletion requests" ON deletion_requests;

-- Create a new policy that properly handles admin insertions using the security definer function
CREATE POLICY "Admins can manage deletion requests" ON deletion_requests
  FOR ALL USING (
    public.get_current_user_role() = 'admin'
  )
  WITH CHECK (
    public.get_current_user_role() = 'admin'
  );

-- Also ensure admins can insert into gdpr_audit_log
DROP POLICY IF EXISTS "Admins can access GDPR audit log" ON gdpr_audit_log;

CREATE POLICY "Admins can access GDPR audit log" ON gdpr_audit_log
  FOR ALL USING (
    public.get_current_user_role() = 'admin'
  )
  WITH CHECK (
    public.get_current_user_role() = 'admin'
  );