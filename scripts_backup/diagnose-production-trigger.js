require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function diagnoseProductionTrigger() {
  console.log('🔍 Comprehensive Production Trigger Diagnosis...\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('🌐 Supabase URL:', supabaseUrl)
    console.log('🔑 Service key configured:', supabaseServiceKey ? 'Yes' : 'No')
    console.log()
    
    // 1. Check if asifantu008@gmail.com exists and get details
    console.log('1. Checking user asifantu008@gmail.com in auth...')
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
    
    console.log('✅ User found in auth:')
    console.log('   - ID:', testUser.id)
    console.log('   - Email:', testUser.email)
    console.log('   - Created:', testUser.created_at)
    console.log('   - Provider:', testUser.app_metadata?.provider || 'unknown')
    console.log()
    
    // 2. Check if profile exists
    console.log('2. Checking if profile exists...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single()
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('❌ Profile MISSING - trigger failed to create profile')
    } else if (profileError) {
      console.error('❌ Error checking profile:', profileError.message)
    } else {
      console.log('✅ Profile EXISTS:')
      console.log('   - Plan:', profile.plan)
      console.log('   - Created:', profile.created_at)
      console.log('   - Email:', profile.email)
      return // Exit early if profile exists
    }
    console.log()
    
    // 3. Check database trigger function exists
    console.log('3. Checking if trigger function exists...')
    try {
      // Try to get function info using rpc
      const { data: funcCheck, error: funcError } = await supabase
        .rpc('exec_sql', { 
          query: `SELECT EXISTS(
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE p.proname = 'handle_new_user' AND n.nspname = 'public'
          ) as function_exists;` 
        })
      
      if (funcError) {
        console.log('⚠️ Cannot check function directly (expected in production)')
      } else {
        console.log('Function check result:', funcCheck)
      }
    } catch (e) {
      console.log('⚠️ Cannot execute SQL check (expected in production)')
    }
    console.log()
    
    // 4. Check trigger exists
    console.log('4. Checking if trigger exists...')
    try {
      const { data: triggerCheck, error: triggerError } = await supabase
        .rpc('exec_sql', { 
          query: `SELECT EXISTS(
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
          ) as trigger_exists;` 
        })
      
      if (triggerError) {
        console.log('⚠️ Cannot check trigger directly (expected in production)')
      } else {
        console.log('Trigger check result:', triggerCheck)
      }
    } catch (e) {
      console.log('⚠️ Cannot execute SQL check (expected in production)')
    }
    console.log()
    
    // 5. Test creating a profile manually (to check permissions)
    console.log('5. Testing manual profile creation (permission check)...')
    try {
      const { data: manualProfile, error: manualError } = await supabase
        .from('profiles')
        .insert({
          id: testUser.id,
          email: testUser.email,
          plan: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (manualError) {
        console.error('❌ Failed to create profile manually:', manualError.message)
        console.log('   - This suggests RLS or permission issues')
      } else {
        console.log('✅ Manual profile creation SUCCESSFUL')
        console.log('   - Profile created:', manualProfile.id)
        console.log('   - The trigger should work, but something is preventing it')
      }
    } catch (e) {
      console.error('❌ Manual profile creation failed:', e.message)
    }
    console.log()
    
    // 6. Provide diagnosis and solutions
    console.log('🩺 DIAGNOSIS:')
    console.log('=' .repeat(60))
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Issue: User exists in auth but profile was NOT created by trigger')
      console.log()
      console.log('Possible causes:')
      console.log('1. ❌ Trigger function does not exist')
      console.log('2. ❌ Trigger is not properly attached to auth.users table')
      console.log('3. ❌ Row Level Security (RLS) prevents trigger from inserting')
      console.log('4. ❌ Trigger function has syntax errors')
      console.log('5. ❌ Wrong schema permissions')
      console.log()
      
      console.log('🔧 REQUIRED ACTIONS:')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Run this SQL to recreate trigger WITH proper permissions:')
      console.log()
      console.log(`-- First, ensure RLS allows trigger to insert
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Recreate the trigger function with proper security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, created_at, updated_at)
  VALUES (new.id, new.email, 'free', now(), now());
  RETURN new;
EXCEPTION 
  WHEN others THEN
    -- Log error but don't fail auth
    RAISE LOG 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  
-- Re-enable RLS with proper policy for trigger
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow trigger to insert
CREATE POLICY IF NOT EXISTS "Allow trigger to insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (true);`)
      console.log()
      console.log('3. Test by signing up a new user')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

diagnoseProductionTrigger() 