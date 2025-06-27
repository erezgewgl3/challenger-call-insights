
-- Create a new invite token for testing with a different email
INSERT INTO public.invites (token, email, expires_at, created_at)
VALUES ('invite-newuser-2024', 'newuser@saleswhisperer.com', now() + interval '30 days', now());
