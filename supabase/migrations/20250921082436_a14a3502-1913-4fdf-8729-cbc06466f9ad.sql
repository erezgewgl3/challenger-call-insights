-- Create webhook delivery log table for tracking CRM webhook deliveries
CREATE TABLE IF NOT EXISTS public.webhook_delivery_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_id uuid REFERENCES public.transcripts(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  payload_size integer,
  success boolean NOT NULL,
  response_status integer,
  error_message text,
  delivered_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_log_transcript ON public.webhook_delivery_log(transcript_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_success ON public.webhook_delivery_log(success);
CREATE INDEX IF NOT EXISTS idx_webhook_log_delivered_at ON public.webhook_delivery_log(delivered_at);

-- Enable RLS
ALTER TABLE public.webhook_delivery_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see logs for their transcripts only
CREATE POLICY "webhook_log_unified_access" ON public.webhook_delivery_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.transcripts 
      WHERE id = webhook_delivery_log.transcript_id 
      AND (user_id = auth.uid() OR assigned_user_id = auth.uid())
    ) OR (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );