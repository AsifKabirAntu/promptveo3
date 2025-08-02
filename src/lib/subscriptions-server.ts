import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import type { UserSubscription } from './subscriptions'

// Get user subscription (server-side)
export async function getUserSubscriptionServer(): Promise<UserSubscription | null> {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (error || !subscription) {
    return null
  }

  return subscription
} 