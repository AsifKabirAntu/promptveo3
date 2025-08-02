import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance (only available on server)
let stripe: Stripe | null = null
let STRIPE_PRODUCTS: { PRO_MONTHLY: string; PRO_YEARLY: string } | null = null

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

  if (!monthlyPriceId || !yearlyPriceId) {
    throw new Error('Stripe price IDs are not configured. Please set STRIPE_PRO_MONTHLY_PRICE_ID and STRIPE_PRO_YEARLY_PRICE_ID')
  }

  STRIPE_PRODUCTS = {
    PRO_MONTHLY: monthlyPriceId,
    PRO_YEARLY: yearlyPriceId,
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
}: {
  userId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe is not initialized')
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: undefined, // Will be collected during checkout
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    })

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