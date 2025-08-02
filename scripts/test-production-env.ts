import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

function testProductionEnv() {
  console.log('Testing production environment variables...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ]
  
  console.log('\nRequired environment variables:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    const exists = !!value
    const masked = exists ? `${value?.substring(0, 8)}...` : 'MISSING'
    console.log(`${exists ? '✅' : '❌'} ${varName}: ${masked}`)
  })
  
  console.log('\nProduction URLs:')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Stripe Publishable Key exists:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  console.log('Stripe Secret Key exists:', !!process.env.STRIPE_SECRET_KEY)
  console.log('Webhook Secret exists:', !!process.env.STRIPE_WEBHOOK_SECRET)
  
  // Check if we're using test or live keys
  const stripeKey = process.env.STRIPE_SECRET_KEY || ''
  const isTestMode = stripeKey.startsWith('sk_test_')
  console.log('\nStripe Mode:', isTestMode ? 'TEST' : 'LIVE')
  
  if (!isTestMode && stripeKey.startsWith('sk_live_')) {
    console.log('⚠️  WARNING: Using LIVE Stripe keys!')
  }
}

testProductionEnv() 