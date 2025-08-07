import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { UserProductUsage, UsageLimits, calculateUsageLimits } from '../types/usage'
import { getUserSubscriptionClient } from '@/lib/subscriptions'

const supabase = createClientComponentClient<Database>()

// Get current month's usage for the authenticated user
export async function getCurrentMonthUsage(): Promise<UserProductUsage | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Use the RPC function instead of direct table query to avoid RLS issues
    const { data, error } = await supabase.rpc('get_or_create_monthly_usage', {
      user_uuid: user.id
    })

    if (error) {
      throw error
    }

    return data || null
  } catch (error) {
    console.error('Error getting current month usage:', error)
    throw error
  }
}

// Get usage limits for the current user
export async function getUserUsageLimits(): Promise<UsageLimits> {
  try {
    // Get usage data first
    const usage = await getCurrentMonthUsage()
    
    // Get subscription data
    const subscription = await getUserSubscriptionClient()

    const plan = subscription?.plan === 'pro' ? 'pro' : 'free'
    return calculateUsageLimits(usage, plan)
  } catch (error) {
    console.error('Error getting usage limits:', error)
    // Return free plan limits as fallback
    return calculateUsageLimits(null, 'free')
  }
}

// Check if user can upload (with subscription check)
export async function canUserUpload(): Promise<boolean> {
  try {
    const limits = await getUserUsageLimits()
    return limits.canUpload
  } catch (error) {
    console.error('Error checking upload permissions:', error)
    return false
  }
}

// Check if user can generate prompts (with subscription check)
export async function canUserGeneratePrompt(): Promise<boolean> {
  try {
    const limits = await getUserUsageLimits()
    return limits.canGeneratePrompt
  } catch (error) {
    console.error('Error checking prompt generation permissions:', error)
    return false
  }
}

// Check if user can delete products (free users cannot delete)
export async function canUserDeleteProduct(): Promise<boolean> {
  try {
    const subscription = await getUserSubscriptionClient()
    return subscription?.plan === 'pro'
  } catch (error) {
    console.error('Error checking delete permissions:', error)
    return false
  }
}

// Increment upload usage (called after successful upload)
export async function incrementUploadUsage(): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { error } = await supabase.rpc('increment_upload_usage', {
      user_uuid: user.id
    })

    if (error) throw error
  } catch (error) {
    console.error('Error incrementing upload usage:', error)
    throw error
  }
}

// Increment prompt generation usage (called after successful generation)
export async function incrementPromptGenerationUsage(): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { error } = await supabase.rpc('increment_prompt_generation_usage', {
      user_uuid: user.id
    })

    if (error) throw error
  } catch (error) {
    console.error('Error incrementing prompt generation usage:', error)
    throw error
  }
} 