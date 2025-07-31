-- Add timeline column to prompts table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE prompts 
ADD COLUMN timeline TEXT DEFAULT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN prompts.timeline IS 'Timeline or sequence description for the prompt (optional)'; 