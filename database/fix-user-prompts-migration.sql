-- Fixed migration script for user_prompts table
-- This script safely adds missing columns first, then indexes and policies

-- First, let's ensure the table exists with basic structure
DO $$ 
BEGIN
    -- Check if table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_prompts') THEN
        CREATE TABLE user_prompts (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            is_public BOOLEAN DEFAULT true,
            is_featured BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Add essential columns first (needed for constraints and indexes)
DO $$ 
BEGIN
    -- Add prompt_type column first (needed for check constraint and index)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'prompt_type') THEN
        ALTER TABLE user_prompts ADD COLUMN prompt_type TEXT;
    END IF;
    
    -- Add the check constraint for prompt_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'user_prompts' AND constraint_name LIKE '%prompt_type_check%'
    ) THEN
        ALTER TABLE user_prompts ADD CONSTRAINT prompt_type_check CHECK (prompt_type IN ('regular', 'timeline'));
    END IF;
    
    -- Make prompt_type NOT NULL if it's not already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_prompts' 
        AND column_name = 'prompt_type' 
        AND is_nullable = 'YES'
    ) THEN
        -- First update any NULL values to 'regular' as default
        UPDATE user_prompts SET prompt_type = 'regular' WHERE prompt_type IS NULL;
        -- Then add NOT NULL constraint
        ALTER TABLE user_prompts ALTER COLUMN prompt_type SET NOT NULL;
    END IF;
END $$;

-- Add all other columns
DO $$ 
BEGIN
    -- Regular prompt specific fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'style') THEN
        ALTER TABLE user_prompts ADD COLUMN style TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'camera') THEN
        ALTER TABLE user_prompts ADD COLUMN camera TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'lighting') THEN
        ALTER TABLE user_prompts ADD COLUMN lighting TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'environment') THEN
        ALTER TABLE user_prompts ADD COLUMN environment TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'elements') THEN
        ALTER TABLE user_prompts ADD COLUMN elements TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'motion') THEN
        ALTER TABLE user_prompts ADD COLUMN motion TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'ending') THEN
        ALTER TABLE user_prompts ADD COLUMN ending TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'text') THEN
        ALTER TABLE user_prompts ADD COLUMN text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'keywords') THEN
        ALTER TABLE user_prompts ADD COLUMN keywords TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'timeline') THEN
        ALTER TABLE user_prompts ADD COLUMN timeline TEXT;
    END IF;
    
    -- Timeline prompt specific fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'base_style') THEN
        ALTER TABLE user_prompts ADD COLUMN base_style TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'aspect_ratio') THEN
        ALTER TABLE user_prompts ADD COLUMN aspect_ratio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'scene_description') THEN
        ALTER TABLE user_prompts ADD COLUMN scene_description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'camera_setup') THEN
        ALTER TABLE user_prompts ADD COLUMN camera_setup TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'negative_prompts') THEN
        ALTER TABLE user_prompts ADD COLUMN negative_prompts TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'timeline_sequence') THEN
        ALTER TABLE user_prompts ADD COLUMN timeline_sequence JSONB;
    END IF;
    
    -- Metadata fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'likes_count') THEN
        ALTER TABLE user_prompts ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'usage_count') THEN
        ALTER TABLE user_prompts ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Now create indexes (after all columns exist)
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

-- Create policies if they don't exist
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

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_prompts_updated_at') THEN
        CREATE TRIGGER update_user_prompts_updated_at
            BEFORE UPDATE ON user_prompts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$; 