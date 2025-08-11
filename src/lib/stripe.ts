import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance (only available on server)
let stripe: Stripe | null = null
let STRIPE_PRODUCTS: { PRO_MONTHLY: string; PRO_YEARLY: string; PRO_ONETIME: string } | null = null

if (typeof window === 'undefined') {
  // Server-side only
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-07-30.basil',
  })

  // Stripe product IDs (server-side only)
  const monthlyPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID
  const yearlyPriceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID
  const onetimePriceId = process.env.STRIPE_PRO_ONETIME_PRICE_ID

  if (!monthlyPriceId || !yearlyPriceId || !onetimePriceId) {
    console.warn('Some Stripe price IDs are not configured. Monthly and yearly are for backward compatibility, onetime is required for new payments.')
  }

  STRIPE_PRODUCTS = {
    PRO_MONTHLY: monthlyPriceId || '',
    PRO_YEARLY: yearlyPriceId || '',
    PRO_ONETIME: onetimePriceId || '',
  }
}

export { stripe, STRIPE_PRODUCTS }

// Client-side Stripe instance
export const getStripe = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!publishableKey) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is not set')
    return null
  }
  return loadStripe(publishableKey)
}

// Create checkout session
export async function createCheckoutSession({
  userId,
  priceId,
  successUrl,
  cancelUrl,
  mode = 'payment', // Default to one-time payment, can be 'subscription' for backward compatibility
}: {
  userId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  mode?: 'payment' | 'subscription'
}) {
  if (!stripe) {
    throw new Error('Stripe is not initialized')
  }
  
  try {
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer_email: undefined, // Will be collected during checkout
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        userId,
      },
    }

    // Add subscription-specific configuration if needed
    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: {
          userId,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Create customer portal session
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe is not initialized')
  }
  
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return session
  } catch (error) {
    console.error('Error creating customer portal session:', error)
    throw error
  }
}

// Get subscription by ID
export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized')
  }
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    throw error
  }
}

// Get customer by ID
export async function getCustomer(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized')
  }
  
  try {
    const customer = await stripe.customers.retrieve(customerId)
    return customer
  } catch (error) {
    console.error('Error retrieving customer:', error)
    throw error
  }
}

// Get customer by email
export async function getCustomerByEmail(email: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized')
  }
  
  try {
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    })
    return customers.data[0] || null
  } catch (error) {
    console.error('Error retrieving customer by email:', error)
    throw error
  }
}

// Create or get customer
export async function createOrGetCustomer({
  email,
  name,
  userId,
}: {
  email: string
  name?: string
  userId: string
}) {
  if (!stripe) {
    throw new Error('Stripe is not initialized')
  }
  
  try {
    // Check if customer already exists
    let customer = await getCustomerByEmail(email)

    if (!customer) {
      // Create new customer
      customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      })
    }

    return customer
  } catch (error) {
    console.error('Error creating/getting customer:', error)
    throw error
  }
} 