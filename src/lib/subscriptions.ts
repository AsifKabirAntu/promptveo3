'use client'

import type { Database } from '@/types/database'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type SubscriptionPlan = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'

export interface UserSubscription {
  id: string
  user_id: string
  subscription_id: string
  status: SubscriptionStatus
  plan: SubscriptionPlan
  price_id?: string
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

export interface SubscriptionFeatures {
  canViewAllPrompts: boolean
  canViewJSON: boolean
  canFavorite: boolean
  canRemix: boolean
  canCreate: boolean
  maxVisiblePrompts: number
}

// Free plan limitations
export const FREE_PLAN_LIMITS = {
  maxVisiblePrompts: 3,
  canViewJSON: false,
  canFavorite: false,
  canRemix: false,
  canCreate: false,
}

// Pro plan features
export const PRO_PLAN_FEATURES = {
  maxVisiblePrompts: Infinity,
  canViewJSON: true,
  canFavorite: true,
  canRemix: true,
  canCreate: true,
}

export async function getUserSubscriptionClient(): Promise<UserSubscription | null> {
  try {
    const supabase = createClientComponentClient<Database>()
    
    // First check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('No authenticated user found')
      return null
    }

    // Try to fetch subscription with retries
    let attempts = 0
    const maxAttempts = 3
    let lastError: any = null

    while (attempts < maxAttempts) {
      try {
        // Add a small delay between retries
        if (attempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        attempts++
        console.log(`Fetching subscription data (attempt ${attempts}/${maxAttempts})`)
        
        // Fetch subscription with a timeout
        const fetchPromise = supabase
          .from('subscriptions')
          .select('*, prices(*, products(*))')
          .eq('user_id', user.id)
          .single()

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Subscription fetch timed out')), 5000)
        })

        // Race the fetch against the timeout
        const { data: subscription, error } = await Promise.race([
          fetchPromise,
          timeoutPromise.then(() => ({ data: null, error: new Error('Timeout') }))
        ]) as any

        if (error) {
          lastError = error
          console.error(`Error fetching subscription (attempt ${attempts}):`, error)
          continue // Try again
        }

        if (!subscription) {
          console.log('No subscription found for user')
          return {
            id: 'free-tier',
            user_id: user.id,
            subscription_id: '',
            status: 'active' as SubscriptionStatus,
            price_id: undefined,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            plan: 'free' as SubscriptionPlan
          }
        }

        // Map subscription data to our Subscription type
        return {
          id: subscription.id || 'unknown',
          user_id: subscription.user_id,
          subscription_id: subscription.subscription_id || '',
          status: (subscription.status as SubscriptionStatus) || 'active',
          price_id: subscription.price_id,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          created_at: subscription.created_at,
          updated_at: subscription.updated_at || subscription.created_at,
          plan: subscription.plan || getPlanFromPriceId(subscription.price_id)
        }
      } catch (err) {
        lastError = err
        console.error(`Error in subscription fetch (attempt ${attempts}):`, err)
      }
    }

    console.error(`Failed to fetch subscription after ${maxAttempts} attempts`)
    // Return a default free subscription after all retries fail
    return {
      id: 'free-tier',
      user_id: user.id,
      subscription_id: '',
      status: 'active' as SubscriptionStatus,
      price_id: undefined,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      plan: 'free' as SubscriptionPlan
    }
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return null
  }
}

// Helper function to determine plan from price_id
function getPlanFromPriceId(priceId: string | null): 'free' | 'pro' {
  if (!priceId) return 'free'
  return priceId.includes('pro') ? 'pro' : 'free'
}

export function getSubscriptionFeatures(subscription: any) {
  // Check if subscription exists and has a plan field
  const plan = subscription?.plan || 'free'
  const isPro = plan === 'pro' && subscription?.status === 'active'

  return {
    canViewAllPrompts: isPro,
    canCreatePrompts: isPro,
    canUseTimeline: isPro,
    canExport: isPro,
    canShare: isPro,
    maxPrompts: isPro ? Infinity : 3,
    maxTimelinePrompts: isPro ? Infinity : 1,
  }
}

// Check if user has pro access
export function hasProAccess(subscription: UserSubscription | null): boolean {
  // Consider active subscription as pro regardless of plan field
  return subscription?.status === 'active'
}

// Check if user has free access
export function hasFreeAccess(subscription: UserSubscription | null): boolean {
  return !subscription || subscription.status !== 'active'
}

// Get plan display name
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'free':
      return 'Free'
    case 'pro':
      return 'Pro'
    default:
      return 'Free'
  }
}

// Get plan price
export function getPlanPrice(plan: SubscriptionPlan, interval: 'month' | 'year' = 'month'): string {
  switch (plan) {
    case 'free':
      return 'Free'
    case 'pro':
      return interval === 'year' ? '$120/year' : '$14.99/month'
    default:
      return 'Free'
  }
} 