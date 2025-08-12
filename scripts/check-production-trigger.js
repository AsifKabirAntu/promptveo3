require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkProductionTrigger() {
  console.log('🔍 Checking production database trigger status...\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Check if the user exists in auth but not in profiles
    console.log('1. Checking if asifantu008@gmail.com exists in auth but missing profile...')
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return
    }
    
    const testUser = authUsers.users.find(u => u.email === 'asifantu008@gmail.com')
    if (!testUser) {
      console.log('❌ User asifantu008@gmail.com not found in auth')
      return
    }
    
    console.log('✅ Found user in auth:', testUser.id)
    
    // 2. Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single()
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('❌ Profile missing for user - trigger is NOT working in production')
      console.log('🔧 This confirms the database trigger needs to be fixed in production')
    } else if (profileError) {
      console.error('❌ Error checking profile:', profileError.message)
    } else {
      console.log('✅ Profile exists - trigger might be working')
      return
    }
    
    // 3. Show the SQL that needs to be run in production
    console.log('\n🚨 PRODUCTION FIX REQUIRED:')
    console.log('You need to run this SQL in your Supabase production dashboard:')
    console.log('=' .repeat(80))
    console.log(`
-- Create the trigger function that automatically creates profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, created_at, updated_at)
  VALUES (new.id, new.email, 'free', now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create the new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`)
    console.log('=' .repeat(80))
    console.log('\n📋 Steps to fix:')
    console.log('1. Go to your Supabase dashboard → SQL Editor')
    console.log('2. Copy and paste the SQL above')
    console.log('3. Run the SQL to create the trigger')
    console.log('4. Test with a new signup to verify it works')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkProductionTrigger() 