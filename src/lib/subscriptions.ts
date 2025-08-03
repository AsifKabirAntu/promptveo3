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

// Helper for direct API fetching with timeout
async function fetchDirectFromSupabase<T>(endpoint: string, options = {}): Promise<T> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), 10000);
  });
  
  const fetchPromise = fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      ...options
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  });
  
  return Promise.race([fetchPromise, timeoutPromise]);
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

    console.log('Fetching subscription data for user:', user.id)
    
    try {
      // First try to fetch from profiles table (correct location)
      console.log('Checking profiles table for subscription data...')
      const profiles = await fetchDirectFromSupabase<any[]>(
        `profiles?user_id=eq.${user.id}&select=*`
      )
      
      if (profiles && profiles.length > 0) {
        const profile = profiles[0]
        console.log('Found user profile with plan:', profile.plan)
        
        // If we have plan information in the profile, use that
        if (profile.plan) {
          return {
            id: 'profile-' + user.id,
            user_id: user.id,
            subscription_id: profile.subscription_id || '',
            status: (profile.subscription_status || 'active') as SubscriptionStatus,
            plan: (profile.plan || 'free') as SubscriptionPlan,
            price_id: profile.price_id,
            current_period_start: profile.subscription_period_start || new Date().toISOString(),
            current_period_end: profile.subscription_period_end || new Date().toISOString(),
            created_at: profile.created_at || new Date().toISOString(),
            updated_at: profile.updated_at || new Date().toISOString()
          }
        }
      }
      
      // If no profile or no plan in profile, try subscriptions table
      console.log('Checking subscriptions table...')
      const subscriptions = await fetchDirectFromSupabase<any[]>(
        `subscriptions?user_id=eq.${user.id}&select=*`
      )
      
      if (subscriptions && subscriptions.length > 0) {
        const subscription = subscriptions[0]
        console.log('Found subscription with status:', subscription.status)
        
        return {
          id: subscription.id || 'subscription-' + user.id,
          user_id: user.id,
          subscription_id: subscription.subscription_id || '',
          status: (subscription.status || 'active') as SubscriptionStatus,
          plan: subscription.plan || getPlanFromPriceId(subscription.price_id),
          price_id: subscription.price_id,
          current_period_start: subscription.current_period_start || new Date().toISOString(),
          current_period_end: subscription.current_period_end || new Date().toISOString(),
          created_at: subscription.created_at || new Date().toISOString(),
          updated_at: subscription.updated_at || new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    }
    
    // If we get here, no subscription was found
    console.log('No subscription found, returning free plan')
    return {
      id: 'free-tier',
      user_id: user.id,
      subscription_id: '',
      status: 'active' as SubscriptionStatus,
      plan: 'free' as SubscriptionPlan,
      price_id: undefined,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error in getUserSubscriptionClient:', error)
    return null
  }
}

// Helper function to determine plan from price_id
function getPlanFromPriceId(priceId: string | null): 'free' | 'pro' {
  if (!priceId) return 'free'
  return priceId.includes('pro') ? 'pro' : 'free'
}

export function getSubscriptionFeatures(subscription: any) {
  const isPro = subscription?.status === 'active' && subscription?.plan === 'pro'
  
  if (isPro) {
    return PRO_PLAN_FEATURES
  }
  
  return FREE_PLAN_LIMITS
}

export function hasProAccess(subscription: UserSubscription | null): boolean {
  if (!subscription) return false
  return subscription.status === 'active' && subscription.plan === 'pro'
}

export function hasFreeAccess(subscription: UserSubscription | null): boolean {
  return true // Everyone has access to free features
}

export function getPlanDisplayName(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'pro':
      return 'Pro'
    case 'free':
      return 'Free'
    default:
      return 'Unknown'
  }
}

export function getPlanPrice(plan: SubscriptionPlan, interval: 'month' | 'year' = 'month'): string {
  switch (plan) {
    case 'pro':
      return interval === 'month' ? '$14.99' : '$120'
    case 'free':
      return '$0'
    default:
      return '$0'
  }
} 