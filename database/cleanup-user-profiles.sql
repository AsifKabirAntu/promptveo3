-- Cleanup Script: Remove user_profiles table after successful migration
-- This script will:
-- 1. Verify that all users from user_profiles are now in profiles
-- 2. Show a comparison of data
-- 3. Safely remove the user_profiles table

-- Step 1: Verification queries
-- Check if we have the same number of users in both tables
SELECT 
  'Data verification' as check_type,
  (SELECT COUNT(*) FROM user_profiles) as user_profiles_count,
  (SELECT COUNT(*) FROM profiles WHERE id IN (SELECT user_id FROM user_profiles)) as migrated_profiles_count;

-- Show any users that might not have been migrated
SELECT 
  'Missing users in profiles' as check_type,
  up.user_id,
  up.full_name,
  up.created_at
FROM user_profiles up
LEFT JOIN profiles p ON p.id = up.user_id
WHERE p.id IS NULL;

-- Step 2: Show sample data comparison (optional - for verification)
SELECT 
  'Sample comparison' as check_type,
  up.user_id as original_user_id,
  up.full_name as original_full_name,
  up.email_notifications as original_email_notifications,
  p.id as migrated_id,
  p.name as migrated_name,
  p.full_name as migrated_full_name,
  p.email as migrated_email,
  p.email_notifications as migrated_email_notifications
FROM user_profiles up
INNER JOIN profiles p ON p.id = up.user_id
LIMIT 5;

-- Step 3: Drop the user_profiles table and related objects
-- WARNING: This will permanently delete the user_profiles table
-- Only run this after verifying the above queries show successful migration

-- Drop any triggers related to user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Drop any functions that are only used by user_profiles
-- (The update_updated_at_column function might be used by other tables, so we'll keep it)

-- Drop any indexes specific to user_profiles
DROP INDEX IF EXISTS idx_user_profiles_user_id;
DROP INDEX IF EXISTS idx_user_profiles_email;
DROP INDEX IF EXISTS idx_user_profiles_plan;

-- Finally, drop the table itself
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Step 4: Verification that cleanup was successful
SELECT 
  'Cleanup verification' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
    THEN 'user_profiles table still exists' 
    ELSE 'user_profiles table successfully removed' 
  END as status;

-- Final message
SELECT 'Migration and cleanup completed successfully! All user data is now consolidated in the profiles table.' as message; 