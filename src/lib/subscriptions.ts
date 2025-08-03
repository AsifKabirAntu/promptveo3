'use client'

import type { Database } from '@/types/database'
import { createClient } from './supabase-browser'

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

export async function getUserSubscriptionClient() {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) return null

  // Try to fetch subscription data, but handle missing schema gracefully
  try {
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError)
      // Fall through to return default subscription
    } else {
      return subscription
    }
  } catch (error) {
    console.log('Subscription table might not exist yet, using default values')
  }
  
  // Return a default free subscription if we can't fetch the real data
  return {
    id: 'default',
    user_id: user.id,
    status: 'active',
    plan: 'free',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
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