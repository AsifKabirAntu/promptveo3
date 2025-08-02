import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

function fixProductionEnv() {
  console.log('=== PRODUCTION ENVIRONMENT FIX ===')
  
  console.log('\n📋 REQUIRED VERCEL ENVIRONMENT VARIABLES:')
  console.log('Copy these EXACTLY to your Vercel dashboard:')
  console.log('')
  
  const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
    'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET,
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  }
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (value) {
      console.log(`${key}=${value}`)
    } else {
      console.log(`❌ ${key}=MISSING`)
    }
  })
  
  console.log('\n🔧 STEPS TO FIX PRODUCTION:')
  console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
  console.log('2. Delete ALL existing environment variables')
  console.log('3. Add the variables above one by one')
  console.log('4. Make sure to set Environment to "Production" for each variable')
  console.log('5. Click "Save" and redeploy your application')
  
  console.log('\n🌐 PRODUCTION WEBHOOK SETUP:')
  console.log('1. Go to Stripe Dashboard → Developers → Webhooks')
  console.log('2. Find or create webhook endpoint: https://www.promptveo3.com/api/billing/webhook')
  console.log('3. Make sure these events are selected:')
  console.log('   - checkout.session.completed')
  console.log('   - customer.subscription.created')
  console.log('   - customer.subscription.updated')
  console.log('   - customer.subscription.deleted')
  console.log('4. Copy the webhook signing secret and update STRIPE_WEBHOOK_SECRET in Vercel')
  
  console.log('\n✅ VERIFICATION:')
  console.log('After updating Vercel environment variables:')
  console.log('1. Redeploy your application')
  console.log('2. Test the subscription flow')
  console.log('3. Check that prompts load without timeout')
  console.log('4. Test the sign out button')
  
  console.log('\n🚨 IMPORTANT:')
  console.log('- Make sure all environment variables are set to "Production" environment')
  console.log('- Don\'t set them to "Preview" or "Development"')
  console.log('- The webhook secret must match your production Stripe webhook endpoint')
}

fixProductionEnv() 