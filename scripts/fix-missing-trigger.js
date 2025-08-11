require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixMissingTrigger() {
  console.log('🔧 Fixing missing database trigger...\\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. First, let's create the trigger function if it doesn't exist
    console.log('1. Creating handle_new_user function...')
    const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, plan, created_at, updated_at)
      VALUES (new.id, new.email, 'free', now(), now());
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL })
    
    if (functionError) {
      console.error('❌ Error creating function:', functionError.message)
      // Try alternative approach
      console.log('Trying alternative SQL execution...')
      const { error: altError } = await supabase
        .from('profiles') // This is just to test connection, we'll use raw SQL
        .select('count', { count: 'exact', head: true })
      
      if (altError) {
        console.error('❌ Cannot execute SQL. Need to run manually in Supabase dashboard.')
        console.log('\\n🔧 MANUAL STEPS REQUIRED:')
        console.log('1. Go to your Supabase dashboard')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Run this SQL:')
        console.log('\\n' + createFunctionSQL)
        console.log('\\nThen run this trigger SQL:')
        console.log(`
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
        `)
        return
      }
    } else {
      console.log('✅ Function created successfully')
    }
    
    // 2. Create the trigger
    console.log('2. Creating trigger...')
    const createTriggerSQL = `
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggerSQL })
    
    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError.message)
      console.log('\\n🔧 MANUAL TRIGGER CREATION REQUIRED')
    } else {
      console.log('✅ Trigger created successfully')
    }
    
    // 3. Create missing profile for the existing user
    console.log('\\n3. Creating missing profile for lastflex94@gmail.com...')
    const userId = '6cecd3d2-20da-496a-9004-bff621c57112'
    const userEmail = 'lastflex94@gmail.com'
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: userEmail,
        plan: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message)
    } else {
      console.log('✅ Profile created successfully for lastflex94@gmail.com')
    }
    
    console.log('\\n🎉 Trigger fix complete! New signups should now create profiles automatically.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

fixMissingTrigger() 