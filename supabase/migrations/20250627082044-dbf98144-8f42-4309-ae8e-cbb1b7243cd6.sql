
-- Delete the current test user from public.users (this will cascade)
DELETE FROM public.users WHERE id = '6891f1fb-62ab-4383-9d90-57a0e3f7b1bb';

-- Reset the existing invite token to be unused and extend expiration
UPDATE public.invites 
SET used_at = NULL, 
    expires_at = now() + interval '30 days'
WHERE token = 'test-invite-2024' AND email = 'test@saleswhisperer.com';

-- Create a fresh backup invite token in case we need it
INSERT INTO public.invites (token, email, expires_at, created_at)
VALUES ('test-invite-fresh-2024', 'test@saleswhisperer.com', now() + interval '30 days', now())
ON CONFLICT (token) DO NOTHING;
