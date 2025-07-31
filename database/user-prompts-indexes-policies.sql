-- Add indexes and policies for user_prompts table
-- Run this AFTER the simple migration script

-- Create indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_prompts_user_id') THEN
        CREATE INDEX idx_user_prompts_user_id ON user_prompts(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_prompts_type') THEN
        CREATE INDEX idx_user_prompts_type ON user_prompts(prompt_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_prompts_category') THEN
        CREATE INDEX idx_user_prompts_category ON user_prompts(category);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_prompts_public') THEN
        CREATE INDEX idx_user_prompts_public ON user_prompts(is_public);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_prompts_created_at') THEN
        CREATE INDEX idx_user_prompts_created_at ON user_prompts(created_at DESC);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_prompts' AND policyname = 'Users can view own prompts or public prompts') THEN
        CREATE POLICY "Users can view own prompts or public prompts" ON user_prompts
            FOR SELECT USING (
                user_id = auth.uid() OR is_public = true
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_prompts' AND policyname = 'Users can insert own prompts') THEN
        CREATE POLICY "Users can insert own prompts" ON user_prompts
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_prompts' AND policyname = 'Users can update own prompts') THEN
        CREATE POLICY "Users can update own prompts" ON user_prompts
            FOR UPDATE USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_prompts' AND policyname = 'Users can delete own prompts') THEN
        CREATE POLICY "Users can delete own prompts" ON user_prompts
            FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;

-- Create timestamp function and trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_prompts_updated_at') THEN
        CREATE TRIGGER update_user_prompts_updated_at
            BEFORE UPDATE ON user_prompts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verify final structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_prompts' 
AND table_schema = 'public'
ORDER BY ordinal_position; 