-- Add new columns for parsed prompt data
ALTER TABLE community_prompts 
ADD COLUMN IF NOT EXISTS veo3_prompt TEXT,
ADD COLUMN IF NOT EXISTS clean_description TEXT,
ADD COLUMN IF NOT EXISTS extracted_tags TEXT[];

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_community_prompts_veo3_prompt ON community_prompts USING gin(to_tsvector('english', veo3_prompt));
CREATE INDEX IF NOT EXISTS idx_community_prompts_clean_description ON community_prompts USING gin(to_tsvector('english', clean_description));
CREATE INDEX IF NOT EXISTS idx_community_prompts_extracted_tags ON community_prompts USING gin(extracted_tags);

-- Add comment for documentation
COMMENT ON COLUMN community_prompts.veo3_prompt IS 'Parsed Veo 3 prompt content extracted from full_prompt_text';
COMMENT ON COLUMN community_prompts.clean_description IS 'Cleaned description extracted from full_prompt_text';  
COMMENT ON COLUMN community_prompts.extracted_tags IS 'Array of tags extracted from full_prompt_text'; 