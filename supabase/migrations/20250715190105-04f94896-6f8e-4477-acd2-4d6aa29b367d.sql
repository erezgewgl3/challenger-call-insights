-- Add last_login column to users table for accurate login tracking
ALTER TABLE public.users 
ADD COLUMN last_login timestamptz;