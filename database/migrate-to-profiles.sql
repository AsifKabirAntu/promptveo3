-- Migration Script: Consolidate to use only profiles table
-- This script will:
-- 1. Ensure profiles table has all necessary columns
-- 2. Migrate any data from user_profiles to profiles
-- 3. Update all foreign key constraints to use profiles
-- 4. Update the trigger to use profiles
-- 5. Clean up user_profiles table

-- Step 1: Ensure profiles table has all necessary columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT false;

-- Step 2: Migrate any data from user_profiles to profiles (if user_profiles exists)
-- First check if user_profiles table exists and has data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Migrate data from user_profiles to profiles
        INSERT INTO profiles (id, email, name, avatar_url, plan, subscription_id, subscription_status, full_name, email_notifications, push_notifications, created_at, updated_at)
        SELECT 
            up.user_id as id,
            au.email as email,  -- Get email from auth.users since user_profiles doesn't have email column
            up.full_name as name,
            NULL as avatar_url,
            'free' as plan,  -- Default plan since user_profiles doesn't have plan column
            NULL as subscription_id,  -- Default since user_profiles doesn't have this column
            NULL as subscription_status,  -- Default since user_profiles doesn't have this column
            up.full_name,
            COALESCE(up.email_notifications, true) as email_notifications,
            COALESCE(up.push_notifications, false) as push_notifications,
            up.created_at,
            up.updated_at
        FROM user_profiles up
        INNER JOIN auth.users au ON au.id = up.user_id  -- Use INNER JOIN to ensure we have auth.users data
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            full_name = EXCLUDED.full_name,
            email_notifications = EXCLUDED.email_notifications,
            push_notifications = EXCLUDED.push_notifications,
            updated_at = EXCLUDED.updated_at;
        
        RAISE NOTICE 'Migrated data from user_profiles to profiles';
    END IF;
END $$;

-- Step 3: Update all foreign key constraints to use profiles table
-- Update subscriptions table
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update prompts table
ALTER TABLE prompts 
DROP CONSTRAINT IF EXISTS prompts_created_by_fkey;

ALTER TABLE prompts 
ADD CONSTRAINT prompts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update user_prompts table
ALTER TABLE user_prompts 
DROP CONSTRAINT IF EXISTS user_prompts_user_id_fkey;

ALTER TABLE user_prompts 
ADD CONSTRAINT user_prompts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update prompt_usage table
ALTER TABLE prompt_usage 
DROP CONSTRAINT IF EXISTS prompt_usage_user_id_fkey;

ALTER TABLE prompt_usage 
ADD CONSTRAINT prompt_usage_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update timeline_prompts table
ALTER TABLE timeline_prompts 
DROP CONSTRAINT IF EXISTS timeline_prompts_created_by_fkey;

ALTER TABLE timeline_prompts 
ADD CONSTRAINT timeline_prompts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update exploded_build_prompts table
ALTER TABLE exploded_build_prompts 
DROP CONSTRAINT IF EXISTS exploded_build_prompts_created_by_fkey;

ALTER TABLE exploded_build_prompts 
ADD CONSTRAINT exploded_build_prompts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update user_products table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_products') THEN
        ALTER TABLE user_products 
        DROP CONSTRAINT IF EXISTS user_products_user_id_fkey;

        ALTER TABLE user_products 
        ADD CONSTRAINT user_products_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update product_analysis_sessions table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_analysis_sessions') THEN
        ALTER TABLE product_analysis_sessions 
        DROP CONSTRAINT IF EXISTS product_analysis_sessions_user_id_fkey;

        ALTER TABLE product_analysis_sessions 
        ADD CONSTRAINT product_analysis_sessions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Update the trigger to use profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 5: Ensure RLS policies exist for profiles
-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;

-- Create comprehensive policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id ON profiles(subscription_id);

-- Grant access to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 7: Clean up user_profiles table (optional - uncomment if you want to remove it)
-- WARNING: This will permanently delete the user_profiles table and all its data
-- Only run this after you've verified the migration worked correctly
-- DROP TABLE IF EXISTS user_profiles CASCADE;

-- Verification queries
SELECT 
  'Total profiles' as check_type,
  COUNT(*) as count
FROM profiles;

SELECT 
  'Users without profiles' as check_type,
  COUNT(*) as count
FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id 
WHERE p.id IS NULL; 