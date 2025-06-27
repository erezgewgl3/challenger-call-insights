
-- Create a new invite token for a completely new user
INSERT INTO public.invites (token, email, expires_at, created_at)
VALUES ('invite-test-user-2024', 'testuser@saleswhisperer.com', now() + interval '30 days', now());
