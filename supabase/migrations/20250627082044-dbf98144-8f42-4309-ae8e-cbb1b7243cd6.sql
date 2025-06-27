
-- Mark the current invite token as used so the user can login
UPDATE public.invites 
SET used_at = now()
WHERE token = 'test-invite-2024' AND email = 'test@saleswhisperer.com';

-- Create a fresh backup invite token in case we need it
INSERT INTO public.invites (token, email, expires_at, created_at)
VALUES ('test-invite-fresh-2024', 'test@saleswhisperer.com', now() + interval '30 days', now())
ON CONFLICT (token) DO NOTHING;
