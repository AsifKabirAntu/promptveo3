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
  maxVisiblePrompts: 4,
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
  console.log(`Fetching from: ${url}`);
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), 10000);
  });
  
  const fetchPromise = fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      ...options
    }
  }).then(async response => {
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
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
      // First try to fetch from profiles table using authenticated client
      console.log('Checking profiles table for subscription data...')
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profilesError) {
        console.error('Error fetching profile:', profilesError)
      } else if (profiles) {
        console.log('Found user profile with plan:', profiles.plan)
        
        // If we have plan information in the profile, use that
        if (profiles.plan) {
          const subscription = {
            id: 'profile-' + user.id,
            user_id: user.id,
            subscription_id: profiles.subscription_id || '',
            status: (profiles.subscription_status || 'active') as SubscriptionStatus,
            plan: (profiles.plan || 'free') as SubscriptionPlan,
            price_id: profiles.price_id,
            current_period_start: profiles.subscription_period_start || new Date().toISOString(),
            current_period_end: profiles.subscription_period_end || new Date().toISOString(),
            created_at: profiles.created_at || new Date().toISOString(),
            updated_at: profiles.updated_at || new Date().toISOString()
          }
          
          // Save to localStorage for caching system
          try {
            localStorage.setItem('subscription_data', JSON.stringify({
              plan: subscription.plan,
              status: subscription.status,
              updated_at: new Date().toISOString()
            }))
          } catch (e) {
            console.error('Error saving subscription to localStorage:', e)
          }
          
          return subscription
        }
      }
      
      // If no profile or no plan in profile, try subscriptions table
      console.log('Checking subscriptions table...')
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (subscriptionsError) {
        console.error('Error fetching subscriptions:', subscriptionsError)
      } else if (subscriptions) {
        console.log('Found subscription with status:', subscriptions.status)
        
        const userSubscription = {
          id: subscriptions.id || 'subscription-' + user.id,
          user_id: user.id,
          subscription_id: subscriptions.subscription_id || '',
          status: (subscriptions.status || 'active') as SubscriptionStatus,
          plan: subscriptions.plan || getPlanFromPriceId(subscriptions.price_id),
          price_id: subscriptions.price_id,
          current_period_start: subscriptions.current_period_start || new Date().toISOString(),
          current_period_end: subscriptions.current_period_end || new Date().toISOString(),
          created_at: subscriptions.created_at || new Date().toISOString(),
          updated_at: subscriptions.updated_at || new Date().toISOString()
        }
        
        // Save to localStorage for caching system
        try {
          localStorage.setItem('subscription_data', JSON.stringify({
            plan: userSubscription.plan,
            status: userSubscription.status,
            updated_at: new Date().toISOString()
          }))
        } catch (e) {
          console.error('Error saving subscription to localStorage:', e)
        }
        
        return userSubscription
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    }
    
    // If we get here, no subscription was found
    console.log('No subscription found, returning free plan')
    const freeSubscription = {
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
    
    // Save free plan to localStorage
    try {
      localStorage.setItem('subscription_data', JSON.stringify({
        plan: 'free',
        status: 'active',
        updated_at: new Date().toISOString()
      }))
    } catch (e) {
      console.error('Error saving subscription to localStorage:', e)
    }
    
    return freeSubscription
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