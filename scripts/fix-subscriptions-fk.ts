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

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
})

async function fixSubscriptionsForeignKey() {
  console.log('Fixing subscriptions table foreign key constraint...')
  
  try {
    // 1. Drop the existing foreign key constraint
    console.log('1. Dropping existing foreign key constraint...')
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;'
    })
    
    if (dropError) {
      console.log('Drop constraint error (might not exist):', dropError.message)
    } else {
      console.log('✅ Dropped existing constraint')
    }
    
    // 2. Add the correct foreign key constraint
    console.log('2. Adding correct foreign key constraint...')
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.subscriptions 
            ADD CONSTRAINT subscriptions_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;`
    })
    
    if (addError) {
      console.error('Error adding constraint:', addError)
      return
    }
    
    console.log('✅ Added correct foreign key constraint')
    
    // 3. Test by trying to insert a subscription for the user
    console.log('3. Testing with a subscription insert...')
    const testSubscription = {
      user_id: '5a816845-f381-4c25-8e80-d50e463ca790',
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
    
    const { data: insertedSub, error: insertError } = await supabase
      .from('subscriptions')
      .upsert([testSubscription])
      .select()
      .single()
    
    if (insertError) {
      console.error('Error inserting test subscription:', insertError)
    } else {
      console.log('✅ Successfully inserted test subscription:', insertedSub)
    }
    
  } catch (error) {
    console.error('Error in fixSubscriptionsForeignKey:', error)
  }
}

fixSubscriptionsForeignKey() 