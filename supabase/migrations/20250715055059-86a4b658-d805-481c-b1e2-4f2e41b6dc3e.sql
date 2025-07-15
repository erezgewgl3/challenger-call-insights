-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the registration failure monitoring to run every 5 minutes
SELECT cron.schedule(
  'monitor-registration-failures',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://jtunkyfoadoowpymibjr.supabase.co/functions/v1/scheduled-registration-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dW5reWZvYWRvb3dweW1pYmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMDg3NjEsImV4cCI6MjA2NjU4NDc2MX0.Hjb_P57qg2IKFi7Ox9moiFMUfN73EQgmhGOK7AuUCH4"}'::jsonb,
        body:=concat('{"scheduledRun": true, "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);