import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

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

// Get user subscription (client-side)
export async function getUserSubscriptionClient(): Promise<UserSubscription | null> {
  const supabase = createClientComponentClient<Database>()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !subscription) {
    return null
  }

  // Map database fields to UserSubscription interface
  const mappedSubscription = {
    id: subscription.id,
    user_id: subscription.user_id,
    subscription_id: subscription.stripe_subscription_id || '',
    status: subscription.status as SubscriptionStatus,
    plan: (subscription.plan as SubscriptionPlan) || (subscription.status === 'active' ? 'pro' : 'free'),
    price_id: subscription.price_id,
    current_period_start: subscription.current_period_start || '',
    current_period_end: subscription.current_period_end || '',
    created_at: subscription.created_at || '',
    updated_at: subscription.updated_at || '',
  }

  return mappedSubscription
}

// Get subscription features based on plan
export function getSubscriptionFeatures(subscription: UserSubscription | null): SubscriptionFeatures {
  // Consider active subscription as pro regardless of plan field
  const isPro = subscription?.status === 'active'

  if (isPro) {
    return {
      ...PRO_PLAN_FEATURES,
      canViewAllPrompts: true,
    }
  }

  return {
    ...FREE_PLAN_LIMITS,
    canViewAllPrompts: false,
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