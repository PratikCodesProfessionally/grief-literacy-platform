-- Grief Literacy Platform - Supabase Database Schema
-- Run this SQL in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  storage_preference TEXT CHECK (storage_preference IN ('local', 'cloud', 'hybrid')) DEFAULT 'hybrid',
  encryption_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries table (encrypted content)
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  encrypted_content TEXT NOT NULL,
  encrypted_title TEXT,
  encryption_iv TEXT NOT NULL,
  encryption_salt TEXT NOT NULL,
  mood TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  device_id TEXT NOT NULL,
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'conflict')) DEFAULT 'synced'
);

-- Prompts table (shared journaling prompts)
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User prompt history (track which prompts user has used)
CREATE TABLE IF NOT EXISTS public.user_prompt_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync conflicts table (for multi-device conflict resolution)
CREATE TABLE IF NOT EXISTS public.sync_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID NOT NULL,
  local_version INTEGER NOT NULL,
  cloud_version INTEGER NOT NULL,
  local_data JSONB NOT NULL,
  cloud_data JSONB NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_strategy TEXT CHECK (resolution_strategy IN ('keep_local', 'keep_cloud', 'merge')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_updated_at ON public.journal_entries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_deleted_at ON public.journal_entries(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_sync_status ON public.journal_entries(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user_id ON public.sync_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_resolved ON public.sync_conflicts(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_user_prompt_history_user_id ON public.user_prompt_history(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Journal entries policies
CREATE POLICY "Users can view own journal entries"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Prompts policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view prompts"
  ON public.prompts FOR SELECT
  TO authenticated
  USING (true);

-- User prompt history policies
CREATE POLICY "Users can view own prompt history"
  ON public.user_prompt_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompt history"
  ON public.user_prompt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sync conflicts policies
CREATE POLICY "Users can view own conflicts"
  ON public.sync_conflicts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conflicts"
  ON public.sync_conflicts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conflicts"
  ON public.sync_conflicts FOR UPDATE
  USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for journal_entries updated_at
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment version on journal entry update
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for journal_entries version increment
CREATE TRIGGER increment_journal_version
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION increment_version();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Seed some default prompts
INSERT INTO public.prompts (category, text, difficulty, tags) VALUES
  ('Grief', 'Write about a favorite memory with your loved one', 'beginner', ARRAY['memory', 'positive']),
  ('Grief', 'Describe how you''re feeling today, without judgment', 'beginner', ARRAY['emotions', 'awareness']),
  ('Grief', 'What would you like to say to your loved one if you could?', 'intermediate', ARRAY['communication', 'closure']),
  ('Grief', 'How has grief changed you? What have you learned about yourself?', 'advanced', ARRAY['growth', 'reflection']),
  ('Self-Care', 'What brought you joy today, even if just for a moment?', 'beginner', ARRAY['gratitude', 'joy']),
  ('Self-Care', 'What do you need to forgive yourself for?', 'intermediate', ARRAY['forgiveness', 'compassion']),
  ('Processing', 'Write a letter you''ll never send, expressing everything you need to say', 'intermediate', ARRAY['expression', 'release']),
  ('Processing', 'Describe the physical sensations you experience when grief hits', 'advanced', ARRAY['embodiment', 'awareness']),
  ('Hope', 'What are you looking forward to, even if it''s something small?', 'beginner', ARRAY['hope', 'future']),
  ('Hope', 'How do you want to honor your loved one''s memory moving forward?', 'intermediate', ARRAY['legacy', 'meaning'])
ON CONFLICT DO NOTHING;

-- Storage bucket for avatars (optional)
-- Run this in Supabase Storage section:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars (optional)
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own avatar"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
