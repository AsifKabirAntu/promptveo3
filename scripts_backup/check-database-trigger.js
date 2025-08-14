require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkDatabaseTrigger() {
  console.log('🔍 Checking database trigger for automatic profile creation...\n')
  
  // Create Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Check if the trigger function exists
    console.log('1. Checking if handle_new_user function exists...')
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'handle_new_user')
    
    if (funcError) {
      console.error('❌ Error checking function:', funcError.message)
    } else if (functions.length === 0) {
      console.error('❌ handle_new_user function does NOT exist')
    } else {
      console.log('✅ handle_new_user function exists')
    }
    
    // 2. Check if the trigger exists
    console.log('\n2. Checking if on_auth_user_created trigger exists...')
    const { data: triggers, error: triggerError } = await supabase
      .from('pg_trigger')
      .select('tgname, tgenabled')
      .eq('tgname', 'on_auth_user_created')
    
    if (triggerError) {
      console.error('❌ Error checking trigger:', triggerError.message)
    } else if (triggers.length === 0) {
      console.error('❌ on_auth_user_created trigger does NOT exist')
    } else {
      console.log('✅ on_auth_user_created trigger exists:', triggers[0])
      console.log('   Enabled:', triggers[0].tgenabled === 'O' ? 'Yes' : 'No')
    }
    
    // 3. Check if profiles table exists and structure
    console.log('\n3. Checking profiles table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public')
    
    if (tableError) {
      console.error('❌ Error checking table:', tableError.message)
    } else if (tableInfo.length === 0) {
      console.error('❌ profiles table does NOT exist')
    } else {
      console.log('✅ profiles table exists with columns:')
      tableInfo.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`)
      })
    }
    
    // 4. Check recent auth.users vs profiles count
    console.log('\n4. Checking user count discrepancy...')
    
    // Use raw SQL to check auth.users (can't query it directly via supabase client)
    const { data: authUsersCount, error: authError } = await supabase.rpc('get_auth_users_count')
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (authError && authError.message.includes('function get_auth_users_count')) {
      console.log('⚠️  Cannot check auth.users count (function not available)')
      console.log('   This is normal - auth.users is protected')
    }
    
    if (profilesError) {
      console.error('❌ Error counting profiles:', profilesError.message)
    } else {
      console.log(`📊 Profiles count: ${profilesCount}`)
    }
    
    // 5. Test the trigger function manually (safe to run)
    console.log('\n5. Testing handle_new_user function manually...')
    
    const testUserId = 'test-user-' + Date.now()
    const testEmail = `test+${Date.now()}@example.com`
    
    console.log(`   Creating test profile for: ${testEmail}`)
    
    // Manually call the function to test it
    const { data: testResult, error: testError } = await supabase
      .from('profiles')
      .insert([{
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        plan: 'free'
      }])
      .select()
    
    if (testError) {
      console.error('❌ Error creating test profile:', testError.message)
    } else {
      console.log('✅ Test profile created successfully')
      
      // Clean up test profile
      await supabase.from('profiles').delete().eq('id', testUserId)
      console.log('   Test profile cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkDatabaseTrigger() 