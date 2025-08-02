import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

function checkWebhookSecret() {
  console.log('=== Webhook Secret Check ===')
  
  const localWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  console.log('Local webhook secret:', localWebhookSecret)
  console.log('Secret length:', localWebhookSecret?.length || 0)
  
  if (localWebhookSecret?.startsWith('whsec_')) {
    console.log('✅ Valid webhook secret format')
  } else {
    console.log('❌ Invalid webhook secret format')
  }
  
  console.log('\n=== Instructions ===')
  console.log('1. Copy this webhook secret:')
  console.log(localWebhookSecret)
  console.log('\n2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
  console.log('3. Update STRIPE_WEBHOOK_SECRET with the value above')
  console.log('4. Redeploy your application')
  
  console.log('\n=== Stripe CLI Webhook Secret ===')
  console.log('If you\'re using Stripe CLI locally, the webhook secret should be:')
  console.log('whsec_8035429cfce77a90a573d9c6b0a5434323381805bb21ffa7fef9941c9e87d6e9')
  
  console.log('\n=== Production Webhook Secret ===')
  console.log('For production, you need the webhook secret from your Stripe Dashboard:')
  console.log('1. Go to Stripe Dashboard → Developers → Webhooks')
  console.log('2. Find your production webhook endpoint (https://www.promptveo3.com/api/billing/webhook)')
  console.log('3. Click "Reveal" next to the signing secret')
  console.log('4. Copy that secret and update Vercel environment variable')
}

checkWebhookSecret() 