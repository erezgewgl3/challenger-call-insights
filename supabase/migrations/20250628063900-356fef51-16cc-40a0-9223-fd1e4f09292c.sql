
-- Create prompts table with versioning support
CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_prompt_id uuid REFERENCES public.prompts(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  prompt_text text NOT NULL,
  ai_provider text NOT NULL CHECK (ai_provider IN ('openai', 'claude')),
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  change_description text,
  activated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure only one default prompt per provider
  CONSTRAINT unique_default_per_provider UNIQUE (ai_provider, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Add indexes for performance
CREATE INDEX idx_prompts_parent_id ON public.prompts(parent_prompt_id);
CREATE INDEX idx_prompts_is_active ON public.prompts(is_active) WHERE is_active = true;
CREATE INDEX idx_prompts_ai_provider ON public.prompts(ai_provider);
CREATE INDEX idx_prompts_user_id ON public.prompts(user_id);

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompts
CREATE POLICY "Admins can manage all prompts" ON public.prompts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own prompts" ON public.prompts
  FOR SELECT USING (user_id = auth.uid());

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION update_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_prompts_updated_at_trigger
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_prompts_updated_at();

-- Insert default prompts for both providers
INSERT INTO public.prompts (prompt_text, ai_provider, is_default, is_active, change_description) VALUES
('You are an expert sales coach specializing in the Challenger Sales methodology. Analyze the following sales conversation and provide coaching feedback.

**CONVERSATION:**
{{conversation}}

**ACCOUNT CONTEXT:**
{{account_context}}

**ANALYSIS INSTRUCTIONS:**
1. Score the conversation on three Challenger Sales dimensions (1-5 scale):
   - Teaching: Did the salesperson share unique insights and reframe the customer''s thinking?
   - Tailoring: Was the conversation customized to the customer''s specific situation and needs?
   - Taking Control: Did the salesperson guide the conversation and push back constructively?

2. Provide specific coaching recommendations for improvement.

3. Suggest follow-up actions and timing.

**RESPONSE FORMAT:**
Return your analysis in JSON format with the following structure:
{
  "challenger_scores": {
    "teaching": [1-5],
    "tailoring": [1-5], 
    "control": [1-5]
  },
  "guidance": {
    "recommendation": "Push|Continue|Regroup",
    "message": "Detailed coaching feedback",
    "key_insights": ["insight1", "insight2", "insight3"]
  },
  "email_followup": {
    "subject": "Suggested email subject",
    "body": "Suggested email content",
    "timing": "Recommended timing",
    "channel": "Email|Phone|LinkedIn"
  }
}', 'openai', true, true, 'Default OpenAI coaching prompt'),

('You are an expert sales coach specializing in the Challenger Sales methodology. Your role is to analyze sales conversations and provide actionable coaching insights.

**CONVERSATION TO ANALYZE:**
{{conversation}}

**ACCOUNT BACKGROUND:**
{{account_context}}

**YOUR ANALYSIS TASK:**
Evaluate this sales conversation using the Challenger Sales framework:

1. **Teaching Score (1-5):** How effectively did the salesperson educate the customer with new insights?
2. **Tailoring Score (1-5):** How well was the message customized to this specific customer?
3. **Control Score (1-5):** How effectively did the salesperson guide and challenge the conversation?

For each score, provide specific evidence from the conversation.

**COACHING RECOMMENDATIONS:**
- What should the salesperson do differently?
- What were the strongest moments?
- What follow-up actions would you recommend?

**FOLLOW-UP STRATEGY:**
Suggest the best next steps, including timing, channel, and key messages.

Please format your response as valid JSON with this exact structure:
{
  "challenger_scores": {
    "teaching": <number 1-5>,
    "tailoring": <number 1-5>,
    "control": <number 1-5>
  },
  "guidance": {
    "recommendation": "<Push|Continue|Regroup>",
    "message": "<detailed coaching feedback>",
    "key_insights": ["<insight 1>", "<insight 2>", "<insight 3>"]
  },
  "email_followup": {
    "subject": "<suggested subject line>",
    "body": "<suggested email content>",
    "timing": "<recommended timing>",
    "channel": "<Email|Phone|LinkedIn>"
  }
}', 'claude', true, true, 'Default Claude coaching prompt');
