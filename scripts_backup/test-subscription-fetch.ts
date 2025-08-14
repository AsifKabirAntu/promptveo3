import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSubscriptionFetch() {
  console.log('Testing subscription fetch...')
  
  // First, check if we can see any subscriptions in the database
  console.log('\n1. Checking all subscriptions in database:')
  const { data: allSubscriptions, error: allError } = await supabase
    .from('subscriptions')
    .select('*')
  
  if (allError) {
    console.error('Error fetching all subscriptions:', allError)
  } else {
    console.log('All subscriptions:', allSubscriptions)
  }
  
  // Check if user is authenticated
  console.log('\n2. Checking authentication status:')
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    console.error('Auth error:', authError)
  } else {
    console.log('Current user:', user?.id)
    console.log('User email:', user?.email)
  }
  
  if (user) {
    // Try to fetch subscription for the current user
    console.log('\n3. Fetching subscription for current user:')
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    console.log('Subscription query result:', subscription)
    console.log('Subscription query error:', error)
    
    if (subscription) {
      console.log('\n4. Subscription details:')
      console.log('ID:', subscription.id)
      console.log('User ID:', subscription.user_id)
      console.log('Status:', subscription.status)
      console.log('Plan:', subscription.plan)
      console.log('Stripe Subscription ID:', subscription.stripe_subscription_id)
      console.log('Created at:', subscription.created_at)
      console.log('Updated at:', subscription.updated_at)
    }
  } else {
    console.log('\nNo authenticated user found')
  }
}

testSubscriptionFetch().catch(console.error) 