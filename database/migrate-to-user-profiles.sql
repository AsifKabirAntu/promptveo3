-- Migration Script: Move everything to user_profiles table
-- This script will:
-- 1. Add missing columns to user_profiles
-- 2. Migrate data from profiles to user_profiles
-- 3. Update foreign key constraints
-- 4. Clean up old profiles table

-- Step 1: Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Step 2: Migrate data from profiles to user_profiles
UPDATE user_profiles 
SET 
  email = p.email,
  avatar_url = p.avatar_url,
  plan = p.plan,
  subscription_id = p.subscription_id,
  subscription_status = p.subscription_status
FROM profiles p 
WHERE user_profiles.user_id = p.id;

-- Step 3: Update subscriptions table to reference user_profiles instead of profiles
-- First, drop the existing foreign key constraint
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- Add new foreign key constraint to user_profiles
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Step 4: Update other tables that reference profiles to use user_profiles
-- Update prompts table
ALTER TABLE prompts 
DROP CONSTRAINT IF EXISTS prompts_created_by_fkey;

ALTER TABLE prompts 
ADD CONSTRAINT prompts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Update user_prompts table
ALTER TABLE user_prompts 
DROP CONSTRAINT IF EXISTS user_prompts_user_id_fkey;

ALTER TABLE user_prompts 
ADD CONSTRAINT user_prompts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Update prompt_usage table
ALTER TABLE prompt_usage 
DROP CONSTRAINT IF EXISTS prompt_usage_user_id_fkey;

ALTER TABLE prompt_usage 
ADD CONSTRAINT prompt_usage_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON user_profiles(plan);

-- Step 6: Update RLS policies for user_profiles
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Create comprehensive policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Step 7: Create a trigger to automatically create user_profiles when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 8: Verify migration
-- Check that all users have profiles
SELECT 
  'Users without profiles' as check_type,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL

UNION ALL

-- Check subscriptions
SELECT 
  'Subscriptions count' as check_type,
  COUNT(*) as count
FROM subscriptions

UNION ALL

-- Check user_profiles count
SELECT 
  'User profiles count' as check_type,
  COUNT(*) as count
FROM user_profiles;

-- Step 9: Optional - Drop old profiles table (uncomment when ready)
-- DROP TABLE IF EXISTS profiles CASCADE; 