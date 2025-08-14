require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkTriggerAndFix() {
  console.log('🔍 Checking database trigger and fixing profile creation...\n')
  
  // Create Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Check if the trigger exists
    console.log('1. Checking if trigger exists...')
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            trigger_name, 
            event_manipulation, 
            event_object_table,
            action_statement
          FROM information_schema.triggers 
          WHERE trigger_name = 'on_auth_user_created'
        `
      })
    
    if (triggerError) {
      console.log('❌ Could not check triggers (using direct SQL instead)')
    } else if (triggers && triggers.length > 0) {
      console.log('✅ Trigger exists:', triggers[0])
    } else {
      console.log('❌ Trigger does not exist')
    }
    
    // 2. Check if handle_new_user function exists
    console.log('\n2. Checking if handle_new_user function exists...')
    const { data: functions, error: functionError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            routine_name,
            routine_definition
          FROM information_schema.routines 
          WHERE routine_name = 'handle_new_user'
            AND routine_schema = 'public'
        `
      })
    
    if (functionError) {
      console.log('❌ Could not check functions')
    } else if (functions && functions.length > 0) {
      console.log('✅ Function exists')
    } else {
      console.log('❌ Function does not exist')
    }
    
    // 3. Fix the trigger by running the correct SQL
    console.log('\n3. Creating/updating the trigger...')
    
    const triggerSQL = `
      -- Create or replace the function
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, name, full_name, plan, created_at, updated_at)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
          'free',
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
    `
    
    // We'll need to execute this SQL manually since RPC might not work for DDL
    console.log('📝 SQL to execute:')
    console.log(triggerSQL)
    console.log('\n⚠️  Please run this SQL in your Supabase SQL editor')
    
    // 4. Check users without profiles
    console.log('\n4. Checking for users without profiles...')
    const { data: usersWithoutProfiles, error: checkError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            u.id,
            u.email,
            u.created_at
          FROM auth.users u
          LEFT JOIN public.profiles p ON u.id = p.id
          WHERE p.id IS NULL
          ORDER BY u.created_at DESC
          LIMIT 10
        `
      })
    
    if (checkError) {
      console.log('❌ Could not check users without profiles')
      
      // Fallback: try to create profile for the specific user we know about
      console.log('\n5. Creating profile for lastflex94@gmail.com...')
      const userId = '6cecd3d2-20da-496a-9004-bff621c57112'
      
      // Get user details from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      
      if (authUser.user) {
        const profileData = {
          id: userId,
          email: authUser.user.email,
          name: authUser.user.email.split('@')[0], // Use email prefix as name
          full_name: authUser.user.email.split('@')[0],
          plan: 'pro', // Set to pro since they made payment
          subscription_status: 'active',
          subscription_id: `onetime_manual_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { error: createError } = await supabase
          .from('profiles')
          .upsert([profileData], { onConflict: 'id' })
        
        if (createError) {
          console.log('❌ Error creating profile:', createError)
        } else {
          console.log('✅ Profile created for lastflex94@gmail.com')
        }
      }
    } else if (usersWithoutProfiles && usersWithoutProfiles.length > 0) {
      console.log(`❌ Found ${usersWithoutProfiles.length} users without profiles:`)
      usersWithoutProfiles.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id})`)
      })
      
      // Create profiles for all missing users
      console.log('\n5. Creating missing profiles...')
      for (const user of usersWithoutProfiles) {
        const profileData = {
          id: user.id,
          email: user.email,
          name: user.email ? user.email.split('@')[0] : 'User',
          full_name: user.email ? user.email.split('@')[0] : 'User',
          plan: user.id === '6cecd3d2-20da-496a-9004-bff621c57112' ? 'pro' : 'free',
          subscription_status: user.id === '6cecd3d2-20da-496a-9004-bff621c57112' ? 'active' : null,
          subscription_id: user.id === '6cecd3d2-20da-496a-9004-bff621c57112' ? `onetime_manual_${Date.now()}` : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { error: createError } = await supabase
          .from('profiles')
          .upsert([profileData], { onConflict: 'id' })
        
        if (createError) {
          console.log(`❌ Error creating profile for ${user.email}:`, createError)
        } else {
          console.log(`✅ Profile created for ${user.email}`)
        }
      }
    } else {
      console.log('✅ All users have profiles')
    }
    
    console.log('\n🎉 Fix completed!')
    console.log('💡 Try refreshing your dashboard now.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkTriggerAndFix().catch(console.error) 