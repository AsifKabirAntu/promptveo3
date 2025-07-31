-- Timeline Prompts Schema
-- Run this SQL in your Supabase SQL editor

-- Create timeline_prompts table
CREATE TABLE timeline_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  base_style TEXT NOT NULL,
  aspect_ratio TEXT DEFAULT '16:9',
  scene_description TEXT NOT NULL,
  camera_setup TEXT NOT NULL,
  lighting TEXT NOT NULL,
  negative_prompts TEXT[] DEFAULT '{}',
  timeline JSONB NOT NULL, -- Store timeline array as JSONB
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  likes_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_timeline_prompts_category ON timeline_prompts(category);
CREATE INDEX idx_timeline_prompts_created_at ON timeline_prompts(created_at DESC);
CREATE INDEX idx_timeline_prompts_featured ON timeline_prompts(is_featured);
CREATE INDEX idx_timeline_prompts_public ON timeline_prompts(is_public);
CREATE INDEX idx_timeline_prompts_created_by ON timeline_prompts(created_by);

-- Enable Row Level Security
ALTER TABLE timeline_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for timeline_prompts
CREATE POLICY "Public timeline prompts are viewable by everyone"
  ON timeline_prompts FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own timeline prompts"
  ON timeline_prompts FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own timeline prompts"
  ON timeline_prompts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own timeline prompts"
  ON timeline_prompts FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own timeline prompts"
  ON timeline_prompts FOR DELETE
  USING (auth.uid() = created_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_timeline_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timeline_prompts_updated_at
  BEFORE UPDATE ON timeline_prompts
  FOR EACH ROW EXECUTE FUNCTION update_timeline_prompts_updated_at();

-- Create user_timeline_prompts junction table for favorites
CREATE TABLE user_timeline_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timeline_prompt_id UUID REFERENCES timeline_prompts(id) ON DELETE CASCADE,
  is_favorited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, timeline_prompt_id)
);

-- Enable RLS for user_timeline_prompts
ALTER TABLE user_timeline_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own timeline prompt relationships"
  ON user_timeline_prompts FOR ALL
  USING (auth.uid() = user_id);

-- Create timeline prompt usage tracking
CREATE TABLE timeline_prompt_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  timeline_prompt_id UUID REFERENCES timeline_prompts(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('view', 'export', 'remix')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for timeline_prompt_usage
ALTER TABLE timeline_prompt_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own timeline prompt usage"
  ON timeline_prompt_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timeline prompt usage"
  ON timeline_prompt_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE timeline_prompts IS 'Timeline-based prompts with sequence data for video generation';
COMMENT ON COLUMN timeline_prompts.timeline IS 'JSONB array containing sequence objects with timestamp, action, and audio fields';
COMMENT ON COLUMN timeline_prompts.negative_prompts IS 'Array of negative prompt strings';
COMMENT ON COLUMN timeline_prompts.aspect_ratio IS 'Video aspect ratio (e.g., 16:9, 9:16, 1:1)'; 