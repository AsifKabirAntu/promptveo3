-- Add prompt_category column to community_prompts table
ALTER TABLE community_prompts 
ADD COLUMN IF NOT EXISTS prompt_category TEXT DEFAULT 'General';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_community_prompts_prompt_category 
ON community_prompts(prompt_category);

-- Add comment for documentation
COMMENT ON COLUMN community_prompts.prompt_category IS 'AI-generated category based on extracted_tags analysis'; 