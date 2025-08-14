-- Community Prompts Directory Schema
-- Table to store community-sourced Veo 3 prompts with videos and creator info

CREATE TABLE IF NOT EXISTS community_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic prompt information
  title TEXT NOT NULL,
  description TEXT,
  full_prompt_text TEXT NOT NULL, -- The actual Veo 3 prompt content
  category TEXT DEFAULT 'Community',
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
  
  -- Creator information
  creator_name TEXT NOT NULL,
  creator_profile_url TEXT,
  
  -- Prompt structure (parsed from JSON prompts)
  prompt_structure JSONB, -- Structured prompt data if available
  style TEXT,
  camera_settings TEXT,
  lighting TEXT,
  environment TEXT,
  motion TEXT,
  duration_seconds INTEGER,
  aspect_ratio TEXT,
  
  -- Video information
  video_url TEXT, -- Original video URL
  local_video_path TEXT, -- Path to downloaded video file
  video_thumbnail_url TEXT,
  video_metadata JSONB, -- Duration, size, format, etc.
  
  -- Engagement metrics
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Source tracking (internal use, not displayed)
  source_url TEXT, -- Original source URL
  source_metadata JSONB, -- Original scraping metadata
  
  -- Status and visibility
  is_featured BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'pending')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', description), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C') ||
    setweight(to_tsvector('english', creator_name), 'D')
  ) STORED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_prompts_category ON community_prompts(category);
CREATE INDEX IF NOT EXISTS idx_community_prompts_creator ON community_prompts(creator_name);
CREATE INDEX IF NOT EXISTS idx_community_prompts_featured ON community_prompts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_prompts_public ON community_prompts(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_prompts_search ON community_prompts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_community_prompts_tags ON community_prompts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_community_prompts_created_at ON community_prompts(created_at DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_community_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_community_prompts_updated_at
  BEFORE UPDATE ON community_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_community_prompts_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE community_prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read public prompts
CREATE POLICY "Public prompts are readable by everyone" ON community_prompts
  FOR SELECT USING (is_public = TRUE AND status = 'active');

-- Policy: Authenticated users can insert prompts (for future user submissions)
CREATE POLICY "Authenticated users can insert prompts" ON community_prompts
  FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Function to get community prompts with filters
CREATE OR REPLACE FUNCTION get_community_prompts(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  creator_name TEXT,
  tags TEXT[],
  video_thumbnail_url TEXT,
  views_count INTEGER,
  likes_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.title,
    cp.description,
    cp.category,
    cp.creator_name,
    cp.tags,
    cp.video_thumbnail_url,
    cp.views_count,
    cp.likes_count,
    cp.created_at,
    cp.is_featured
  FROM community_prompts cp
  WHERE cp.is_public = TRUE 
    AND cp.status = 'active'
    AND (p_category IS NULL OR cp.category = p_category)
    AND (p_search IS NULL OR cp.search_vector @@ plainto_tsquery('english', p_search))
  ORDER BY 
    cp.is_featured DESC,
    cp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get a single community prompt with full details
CREATE OR REPLACE FUNCTION get_community_prompt_details(p_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  full_prompt_text TEXT,
  category TEXT,
  tags TEXT[],
  difficulty_level TEXT,
  creator_name TEXT,
  creator_profile_url TEXT,
  prompt_structure JSONB,
  style TEXT,
  camera_settings TEXT,
  lighting TEXT,
  environment TEXT,
  motion TEXT,
  duration_seconds INTEGER,
  aspect_ratio TEXT,
  video_url TEXT,
  local_video_path TEXT,
  video_thumbnail_url TEXT,
  video_metadata JSONB,
  views_count INTEGER,
  likes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN
) AS $$
BEGIN
  -- Increment view count
  UPDATE community_prompts 
  SET views_count = views_count + 1 
  WHERE community_prompts.id = p_id AND is_public = TRUE;
  
  -- Return prompt details
  RETURN QUERY
  SELECT 
    cp.id,
    cp.title,
    cp.description,
    cp.full_prompt_text,
    cp.category,
    cp.tags,
    cp.difficulty_level,
    cp.creator_name,
    cp.creator_profile_url,
    cp.prompt_structure,
    cp.style,
    cp.camera_settings,
    cp.lighting,
    cp.environment,
    cp.motion,
    cp.duration_seconds,
    cp.aspect_ratio,
    cp.video_url,
    cp.local_video_path,
    cp.video_thumbnail_url,
    cp.video_metadata,
    cp.views_count,
    cp.likes_count,
    cp.comments_count,
    cp.created_at,
    cp.is_featured
  FROM community_prompts cp
  WHERE cp.id = p_id 
    AND cp.is_public = TRUE 
    AND cp.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to get categories with counts
CREATE OR REPLACE FUNCTION get_community_categories()
RETURNS TABLE (
  category TEXT,
  prompt_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.category,
    COUNT(*) as prompt_count
  FROM community_prompts cp
  WHERE cp.is_public = TRUE AND cp.status = 'active'
  GROUP BY cp.category
  ORDER BY prompt_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Sample data structure comment
COMMENT ON TABLE community_prompts IS 'Community-sourced Veo 3 prompts with videos and creator attribution';
COMMENT ON COLUMN community_prompts.full_prompt_text IS 'Complete Veo 3 prompt that users can copy and use';
COMMENT ON COLUMN community_prompts.prompt_structure IS 'Parsed JSON structure of the prompt if available';
COMMENT ON COLUMN community_prompts.source_metadata IS 'Internal metadata from scraping, not displayed to users'; 