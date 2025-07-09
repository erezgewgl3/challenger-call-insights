-- Add user status tracking for pending deletions
CREATE TYPE user_status AS ENUM ('active', 'pending_deletion', 'deleted');

-- Add status column to users table with default 'active'
ALTER TABLE users ADD COLUMN status user_status DEFAULT 'active';

-- Create index for efficient querying by status
CREATE INDEX idx_users_status ON users(status);

-- Function to mark users as pending deletion based on deletion requests
CREATE OR REPLACE FUNCTION mark_users_pending_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update users status to pending_deletion if they have active deletion requests
  UPDATE users 
  SET status = 'pending_deletion'
  WHERE id IN (
    SELECT DISTINCT user_id 
    FROM deletion_requests 
    WHERE status = 'pending' 
    AND scheduled_for > now()
  )
  AND status = 'active';
END;
$$;