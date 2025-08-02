import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testProductionDB() {
  console.log('Testing production database connection...')
  console.log('URL:', supabaseUrl)
  console.log('Anon Key exists:', !!supabaseAnonKey)
  
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('prompts')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Test prompts table
    console.log('\n2. Testing prompts table...')
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('id, title, is_public')
      .eq('is_public', true)
      .limit(5)
    
    if (promptsError) {
      console.error('❌ Prompts table error:', promptsError)
    } else {
      console.log('✅ Prompts table accessible')
      console.log('Found prompts:', prompts?.length || 0)
    }
    
    // Test timeline_prompts table
    console.log('\n3. Testing timeline_prompts table...')
    const { data: timelinePrompts, error: timelineError } = await supabase
      .from('timeline_prompts')
      .select('id, title, is_public')
      .eq('is_public', true)
      .limit(5)
    
    if (timelineError) {
      console.error('❌ Timeline prompts table error:', timelineError)
    } else {
      console.log('✅ Timeline prompts table accessible')
      console.log('Found timeline prompts:', timelinePrompts?.length || 0)
    }
    
    // Test subscriptions table
    console.log('\n4. Testing subscriptions table...')
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)
    
    if (subscriptionsError) {
      console.error('❌ Subscriptions table error:', subscriptionsError)
    } else {
      console.log('✅ Subscriptions table accessible')
      console.log('Found subscriptions:', subscriptions?.length || 0)
    }
    
    // Test RLS policies
    console.log('\n5. Testing RLS policies...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ User authentication error:', userError)
    } else {
      console.log('✅ User authentication working')
      console.log('User ID:', user?.id || 'No user')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testProductionDB() 