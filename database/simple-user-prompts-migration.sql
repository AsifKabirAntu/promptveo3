-- Simple migration for user_prompts table
-- Add columns one by one, then indexes and policies

-- First, add all missing columns (no indexes yet)
DO $$ 
BEGIN
    -- Basic columns that might be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'category') THEN
        ALTER TABLE user_prompts ADD COLUMN category TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'is_public') THEN
        ALTER TABLE user_prompts ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'is_featured') THEN
        ALTER TABLE user_prompts ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'prompt_type') THEN
        ALTER TABLE user_prompts ADD COLUMN prompt_type TEXT;
    END IF;
    
    -- Regular prompt fields
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
    
    -- Timeline prompt fields
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

-- Now update prompt_type column and add constraint
DO $$ 
BEGIN
    -- Update any NULL values in prompt_type to 'regular' as default
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'prompt_type') THEN
        UPDATE user_prompts SET prompt_type = 'regular' WHERE prompt_type IS NULL;
        
        -- Add check constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.constraint_column_usage 
            WHERE table_name = 'user_prompts' AND constraint_name LIKE '%prompt_type_check%'
        ) THEN
            ALTER TABLE user_prompts ADD CONSTRAINT prompt_type_check CHECK (prompt_type IN ('regular', 'timeline'));
        END IF;
        
        -- Make NOT NULL if nullable
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_prompts' 
            AND column_name = 'prompt_type' 
            AND is_nullable = 'YES'
        ) THEN
            ALTER TABLE user_prompts ALTER COLUMN prompt_type SET NOT NULL;
        END IF;
    END IF;
END $$;

-- Update category column to make it NOT NULL with default if needed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'category') THEN
        -- Update any NULL categories to a default value
        UPDATE user_prompts SET category = 'General' WHERE category IS NULL;
        
        -- Make NOT NULL if it's currently nullable
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_prompts' 
            AND column_name = 'category' 
            AND is_nullable = 'YES'
        ) THEN
            ALTER TABLE user_prompts ALTER COLUMN category SET NOT NULL;
        END IF;
    END IF;
END $$;

-- Print current table structure for verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_prompts' 
AND table_schema = 'public'
ORDER BY ordinal_position; 