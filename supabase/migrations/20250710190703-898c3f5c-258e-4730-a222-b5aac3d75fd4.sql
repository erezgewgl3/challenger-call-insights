-- Update the existing user status to pending_deletion for freshtest@saleswhisperer.com
UPDATE public.users 
SET status = 'pending_deletion' 
WHERE email = 'freshtest@saleswhisperer.com';