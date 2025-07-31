-- User Prompts Table
-- This table stores prompts created by users (both regular and timeline prompts)

CREATE TABLE user_prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('regular', 'timeline')),
  
  -- Common fields for both types
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Regular prompt specific fields (nullable for timeline prompts)
  style TEXT,
  camera TEXT,
  lighting TEXT,
  environment TEXT,
  elements TEXT[], -- Array of strings
  motion TEXT,
  ending TEXT,
  text TEXT,
  keywords TEXT[], -- Array of strings
  timeline TEXT, -- For regular prompts, this is just descriptive text
  
  -- Timeline prompt specific fields (nullable for regular prompts)
  base_style TEXT,
  aspect_ratio TEXT,
  scene_description TEXT,
  camera_setup TEXT,
  negative_prompts TEXT[], -- Array of strings
  timeline_sequence JSONB, -- For timeline prompts, this contains the actual sequence data
  
  -- Metadata
  likes_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_prompts_user_id ON user_prompts(user_id);
CREATE INDEX idx_user_prompts_type ON user_prompts(prompt_type);
CREATE INDEX idx_user_prompts_category ON user_prompts(category);
CREATE INDEX idx_user_prompts_public ON user_prompts(is_public);
CREATE INDEX idx_user_prompts_created_at ON user_prompts(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own prompts or public prompts
CREATE POLICY "Users can view own prompts or public prompts" ON user_prompts
  FOR SELECT USING (
    user_id = auth.uid() OR is_public = true
  );

-- Policy: Users can only insert their own prompts
CREATE POLICY "Users can insert own prompts" ON user_prompts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own prompts
CREATE POLICY "Users can update own prompts" ON user_prompts
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can only delete their own prompts
CREATE POLICY "Users can delete own prompts" ON user_prompts
  FOR DELETE USING (user_id = auth.uid());

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_prompts_updated_at
  BEFORE UPDATE ON user_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 