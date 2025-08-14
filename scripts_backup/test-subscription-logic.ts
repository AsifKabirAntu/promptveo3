import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

// Load environment variables first
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase environment variables are not set')
}

const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
})

async function testSubscriptionLogic() {
  console.log('Testing subscription logic...')
  
  const userId = '5a816845-f381-4c25-8e80-d50e463ca790'
  
  try {
    // 1. Check if subscription exists in database
    console.log('\n1. Checking existing subscription...')
    const { data: existingSub, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', fetchError)
      return
    }
    
    if (existingSub) {
      console.log('Found existing subscription:', existingSub)
    } else {
      console.log('No existing subscription found')
    }
    
    // 2. Manually insert a test subscription
    console.log('\n2. Inserting test subscription...')
    const testSubscription = {
      user_id: userId,
      stripe_subscription_id: 'sub_1Rrf2hEBqzx53WeqYXpmFvDG',
      stripe_customer_id: 'cus_SnFXlG0IjJzsOg',
      status: 'active',
      price_id: 'price_1RrUTHEBqzx53WeqDzf75KbR',
      plan: 'pro',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    const { data: insertedSub, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert([testSubscription])
      .select()
      .single()
    
    if (insertError) {
      console.error('Error inserting subscription:', insertError)
      return
    }
    
    console.log('Successfully inserted subscription:', insertedSub)
    
    // 3. Test client-side fetching (this will fail in a script environment)
    console.log('\n3. Testing client-side fetching...')
    console.log('Note: This will fail in a script environment due to no browser session')
    console.log('Skipping client-side test in script environment')
    
    // 4. Test server-side fetching
    console.log('\n4. Testing server-side fetching...')
    const { data: serverSub, error: serverError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (serverError) {
      console.error('Server-side fetch error:', serverError)
    } else {
      console.log('Server-side subscription:', serverSub)
    }
    
  } catch (error) {
    console.error('Error in test:', error)
  }
}

testSubscriptionLogic() 