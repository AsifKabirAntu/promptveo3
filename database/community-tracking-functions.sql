-- Functions for tracking views and likes in community prompts

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(prompt_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE community_prompts 
  SET 
    views_count = views_count + 1,
    updated_at = NOW()
  WHERE id = prompt_id 
    AND is_public = TRUE 
    AND status = 'active'
  RETURNING views_count INTO new_count;
  
  -- Return the new count, or 0 if prompt not found/not public
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to increment like count
CREATE OR REPLACE FUNCTION increment_like_count(prompt_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE community_prompts 
  SET 
    likes_count = likes_count + 1,
    updated_at = NOW()
  WHERE id = prompt_id 
    AND is_public = TRUE 
    AND status = 'active'
  RETURNING likes_count INTO new_count;
  
  -- Return the new count, or 0 if prompt not found/not public
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to decrement like count (for unlike)
CREATE OR REPLACE FUNCTION decrement_like_count(prompt_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE community_prompts 
  SET 
    likes_count = GREATEST(likes_count - 1, 0), -- Prevent negative counts
    updated_at = NOW()
  WHERE id = prompt_id 
    AND is_public = TRUE 
    AND status = 'active'
  RETURNING likes_count INTO new_count;
  
  -- Return the new count, or 0 if prompt not found/not public
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql; 