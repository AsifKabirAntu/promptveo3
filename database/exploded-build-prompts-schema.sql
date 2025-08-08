-- Exploded Build Prompts Schema
-- Run this SQL in your Supabase SQL editor

-- Create exploded_build_prompts table
CREATE TABLE IF NOT EXISTS exploded_build_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Exploaded Build',
  -- JSON sections mirroring the provided schema
  shot JSONB NOT NULL,
  subject JSONB NOT NULL,
  scene JSONB NOT NULL,
  visual_details JSONB NOT NULL,
  cinematography JSONB NOT NULL,
  audio JSONB NOT NULL,
  dialogue JSONB NOT NULL,
  -- metadata
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  likes_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exploded_build_prompts_category ON exploded_build_prompts(category);
CREATE INDEX IF NOT EXISTS idx_exploded_build_prompts_created_at ON exploded_build_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exploded_build_prompts_featured ON exploded_build_prompts(is_featured);
CREATE INDEX IF NOT EXISTS idx_exploded_build_prompts_public ON exploded_build_prompts(is_public);
CREATE INDEX IF NOT EXISTS idx_exploded_build_prompts_created_by ON exploded_build_prompts(created_by);

-- Enable RLS
ALTER TABLE exploded_build_prompts ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exploded_build_prompts' AND policyname = 'Public exploded prompts are viewable by everyone'
  ) THEN
    CREATE POLICY "Public exploded prompts are viewable by everyone"
      ON exploded_build_prompts FOR SELECT
      USING (is_public = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exploded_build_prompts' AND policyname = 'Users can view their own exploded prompts'
  ) THEN
    CREATE POLICY "Users can view their own exploded prompts"
      ON exploded_build_prompts FOR SELECT
      USING (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exploded_build_prompts' AND policyname = 'Users can insert their own exploded prompts'
  ) THEN
    CREATE POLICY "Users can insert their own exploded prompts"
      ON exploded_build_prompts FOR INSERT
      WITH CHECK (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exploded_build_prompts' AND policyname = 'Users can update their own exploded prompts'
  ) THEN
    CREATE POLICY "Users can update their own exploded prompts"
      ON exploded_build_prompts FOR UPDATE
      USING (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exploded_build_prompts' AND policyname = 'Users can delete their own exploded prompts'
  ) THEN
    CREATE POLICY "Users can delete their own exploded prompts"
      ON exploded_build_prompts FOR DELETE
      USING (auth.uid() = created_by);
  END IF;
END $$;
-- updated_at trigger
CREATE OR REPLACE FUNCTION update_exploded_build_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_exploded_build_prompts_updated_at ON exploded_build_prompts;
CREATE TRIGGER update_exploded_build_prompts_updated_at
  BEFORE UPDATE ON exploded_build_prompts
  FOR EACH ROW EXECUTE FUNCTION update_exploded_build_prompts_updated_at();

-- Usage tracking table (optional but consistent with others)
CREATE TABLE IF NOT EXISTS exploded_build_prompt_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  exploded_prompt_id UUID REFERENCES exploded_build_prompts(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('view', 'export', 'remix')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE exploded_build_prompt_usage ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exploded_build_prompt_usage' AND policyname = 'Users can view their own exploded prompt usage'
  ) THEN
    CREATE POLICY "Users can view their own exploded prompt usage"
      ON exploded_build_prompt_usage FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exploded_build_prompt_usage' AND policyname = 'Users can insert their own exploded prompt usage'
  ) THEN
    CREATE POLICY "Users can insert their own exploded prompt usage"
      ON exploded_build_prompt_usage FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Comments
COMMENT ON TABLE exploded_build_prompts IS 'Exploded Build prompts with structured JSON sections (shot, subject, scene, visual_details, cinematography, audio, dialogue).';
COMMENT ON COLUMN exploded_build_prompts.shot IS 'JSONB object: composition, lens, frame_rate, camera_movement';
COMMENT ON COLUMN exploded_build_prompts.subject IS 'JSONB object: description, wardrobe, props';
COMMENT ON COLUMN exploded_build_prompts.scene IS 'JSONB object: location, time_of_day, environment';
COMMENT ON COLUMN exploded_build_prompts.visual_details IS 'JSONB object: action, special_effects, hair_clothing_motion';
COMMENT ON COLUMN exploded_build_prompts.cinematography IS 'JSONB object: lighting, color_palette, tone';
COMMENT ON COLUMN exploded_build_prompts.audio IS 'JSONB object: music, ambient, sound_effects, mix_level';
COMMENT ON COLUMN exploded_build_prompts.dialogue IS 'JSONB object: character, line, subtitles'; 