import { config } from 'dotenv'
import Stripe from 'stripe'

// Load environment variables
config({ path: '.env.local' })

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const monthlyPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID
const yearlyPriceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID
const onetimePriceId = process.env.STRIPE_PRO_ONETIME_PRICE_ID

async function testStripe() {
  try {
    console.log('Testing Stripe configuration...')
    
    // Check environment variables
    console.log('\n1. Checking environment variables...')
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY is not set')
      return
    } else {
      console.log('✅ STRIPE_SECRET_KEY is set')
    }
    
    if (!onetimePriceId) {
      console.error('❌ STRIPE_PRO_ONETIME_PRICE_ID is not set (REQUIRED)')
      return
    } else {
      console.log('✅ STRIPE_PRO_ONETIME_PRICE_ID is set:', onetimePriceId)
    }
    
    if (!monthlyPriceId) {
      console.warn('⚠️ STRIPE_PRO_MONTHLY_PRICE_ID is not set (legacy)')
    } else {
      console.log('✅ STRIPE_PRO_MONTHLY_PRICE_ID is set:', monthlyPriceId)
    }
    
    if (!yearlyPriceId) {
      console.warn('⚠️ STRIPE_PRO_YEARLY_PRICE_ID is not set (legacy)')
    } else {
      console.log('✅ STRIPE_PRO_YEARLY_PRICE_ID is set:', yearlyPriceId)
    }
    
    // Initialize Stripe
    console.log('\n2. Initializing Stripe...')
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-07-30.basil',
    })
    console.log('✅ Stripe initialized successfully')
    
    // Test price retrieval - One-time (priority)
    console.log('\n3. Testing one-time price retrieval...')
    try {
      const onetimePrice = await stripe.prices.retrieve(onetimePriceId)
      console.log('✅ One-time price retrieved:', {
        id: onetimePrice.id,
        active: onetimePrice.active,
        currency: onetimePrice.currency,
        unit_amount: onetimePrice.unit_amount,
        type: onetimePrice.type // Should be 'one_time'
      })
    } catch (error) {
      console.error('❌ Error retrieving one-time price:', error)
    }
    
    // Test legacy prices (if set)
    if (monthlyPriceId) {
      console.log('\n4. Testing monthly price retrieval (legacy)...')
      try {
        const monthlyPrice = await stripe.prices.retrieve(monthlyPriceId)
        console.log('✅ Monthly price retrieved:', {
          id: monthlyPrice.id,
          active: monthlyPrice.active,
          currency: monthlyPrice.currency,
          unit_amount: monthlyPrice.unit_amount,
          recurring: monthlyPrice.recurring
        })
      } catch (error) {
        console.error('❌ Error retrieving monthly price:', error)
      }
    }
    
    if (yearlyPriceId) {
      console.log('\n5. Testing yearly price retrieval (legacy)...')
      try {
        const yearlyPrice = await stripe.prices.retrieve(yearlyPriceId)
        console.log('✅ Yearly price retrieved:', {
          id: yearlyPrice.id,
          active: yearlyPrice.active,
          currency: yearlyPrice.currency,
          unit_amount: yearlyPrice.unit_amount,
          recurring: yearlyPrice.recurring
        })
      } catch (error) {
        console.error('❌ Error retrieving yearly price:', error)
      }
    }
    
    // Test customer creation
    console.log('\n6. Testing customer creation...')
    try {
      const testCustomer = await stripe.customers.create({
        email: 'test@example.com',
        name: 'Test Customer',
        metadata: {
          userId: 'test-user-id'
        }
      })
      console.log('✅ Test customer created:', testCustomer.id)
      
      // Clean up test customer
      await stripe.customers.del(testCustomer.id)
      console.log('✅ Test customer cleaned up')
    } catch (error) {
      console.error('❌ Error creating test customer:', error)
    }
    
    // Test checkout session creation (one-time payment)
    console.log('\n7. Testing checkout session creation...')
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: onetimePriceId,
            quantity: 1,
          },
        ],
        mode: 'payment', // One-time payment
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        metadata: {
          userId: 'test-user-id'
        }
      })
      console.log('✅ Checkout session created:', {
        id: session.id,
        mode: session.mode,
        status: session.status,
        url: session.url ? 'URL generated' : 'No URL'
      })
    } catch (error) {
      console.error('❌ Error creating checkout session:', error)
    }
    
    console.log('\n✅ Stripe configuration test completed!')
    
  } catch (error) {
    console.error('Error in testStripe:', error)
  }
}

testStripe() 