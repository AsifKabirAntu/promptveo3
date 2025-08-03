import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTrigger() {
  console.log('=== Checking handle_new_user trigger ===')
  
  try {
    // Check if trigger exists
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', { query: `
        SELECT trigger_name, event_manipulation, event_object_table, action_statement
        FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
      ` })
    
    if (triggerError) {
      console.error('❌ Error checking triggers:', triggerError)
    } else {
      console.log('Triggers found:', triggers)
    }
    
    // Check if function exists
    const { data: functions, error: functionError } = await supabase
      .rpc('sql', { query: `
        SELECT routine_name, routine_type, data_type
        FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user'
      ` })
    
    if (functionError) {
      console.error('❌ Error checking functions:', functionError)
    } else {
      console.log('Functions found:', functions)
    }
    
    // Check recent auth.users
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (authError) {
      console.error('❌ Error checking auth.users:', authError)
      return
    }
    
    console.log('Recent auth.users:', authUsers)
    
    // Check if profiles exist for these users
    for (const user of authUsers || []) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      console.log(`Profile for ${user.email} (${user.id}):`, profile ? '✅ EXISTS' : '❌ MISSING')
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError)
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkTrigger() 