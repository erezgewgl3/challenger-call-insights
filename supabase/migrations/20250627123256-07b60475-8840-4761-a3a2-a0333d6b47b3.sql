
-- Create another new invite token for testing
INSERT INTO public.invites (token, email, expires_at, created_at)
VALUES ('invite-demo-user-2024', 'demouser@saleswhisperer.com', now() + interval '30 days', now());
