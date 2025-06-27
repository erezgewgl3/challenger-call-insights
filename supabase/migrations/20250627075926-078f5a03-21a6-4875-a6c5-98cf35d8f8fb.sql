
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types for Sales Whisperer (only create if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('sales_user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE processing_status AS ENUM ('uploaded', 'processing', 'completed', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (linked to auth.users) - only create if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'sales_user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invites table for invite-only access
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Accounts table for prospect management
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  deal_stage text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transcripts table for call recordings
CREATE TABLE IF NOT EXISTS public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  participants jsonb NOT NULL DEFAULT '[]',
  meeting_date timestamptz NOT NULL,
  duration_minutes integer CHECK (duration_minutes > 0),
  raw_text text CHECK (length(raw_text) <= 1000000),
  status processing_status DEFAULT 'uploaded',
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Conversation analysis results
CREATE TABLE IF NOT EXISTS public.conversation_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  challenger_scores jsonb NOT NULL DEFAULT '{}',
  guidance jsonb NOT NULL DEFAULT '{}',
  email_followup jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_analysis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage invites" ON public.invites;
DROP POLICY IF EXISTS "Public can validate invites" ON public.invites;
DROP POLICY IF EXISTS "Users own their accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users own their transcripts" ON public.transcripts;
DROP POLICY IF EXISTS "Users see analysis for their transcripts" ON public.conversation_analysis;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for invites table (only admins can manage)
CREATE POLICY "Admins can manage invites" ON public.invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Public read access for invite validation during registration
CREATE POLICY "Public can validate invites" ON public.invites
  FOR SELECT USING (used_at IS NULL AND expires_at > now());

-- RLS Policies for accounts table
CREATE POLICY "Users own their accounts" ON public.accounts
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for transcripts table  
CREATE POLICY "Users own their transcripts" ON public.transcripts
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for conversation_analysis table
CREATE POLICY "Users see analysis for their transcripts" ON public.conversation_analysis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.transcripts 
      WHERE id = transcript_id AND user_id = auth.uid()
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'sales_user');
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create test invite token for development (only if it doesn't exist)
INSERT INTO public.invites (token, email, expires_at, created_at)
SELECT 'test-invite-2024', 'test@saleswhisperer.com', now() + interval '30 days', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.invites WHERE token = 'test-invite-2024'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON public.transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_account_id ON public.transcripts(account_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_transcript_id ON public.conversation_analysis(transcript_id);
