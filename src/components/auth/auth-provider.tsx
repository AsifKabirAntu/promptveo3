'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-browser'
import { UserSubscription, getUserSubscriptionClient, getSubscriptionFeatures, SubscriptionFeatures } from '@/lib/subscriptions'

interface AuthContextType {
  user: User | null
  loading: boolean
  subscription: UserSubscription | null
  subscriptionLoading: boolean
  features: SubscriptionFeatures
  refreshSubscription: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const supabase = createClient()

  // Fetch subscription data
  const fetchSubscription = useCallback(async (userId: string | null) => {
    if (!userId) {
      setSubscription(null)
      setSubscriptionLoading(false)
      return
    }

    try {
      console.log('Fetching subscription data for user:', userId)
      const sub = await getUserSubscriptionClient()
      console.log('Subscription data received:', sub)
      setSubscription(sub)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setSubscription(null)
    } finally {
      setSubscriptionLoading(false)
    }
  }, [])

  // Refresh subscription data manually
  const refreshSubscription = useCallback(async () => {
    if (!user?.id) return
    
    setSubscriptionLoading(true)
    await fetchSubscription(user.id)
  }, [user?.id, fetchSubscription])

  // Sign out function
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase.auth])

  // Poll for subscription updates when returning from Stripe
  useEffect(() => {
    if (window.location.search.includes('success=true')) {
      let attempts = 0
      const maxAttempts = 10 // Increased from 5 to 10
      const pollInterval = 1000 // Decreased from 2000 to 1000 (1 second)

      const pollSubscription = async () => {
        console.log('Polling for subscription update, attempt:', attempts + 1)
        
        try {
          const sub = await getUserSubscriptionClient()
          console.log('Polled subscription data:', sub)
          
          if (sub?.status === 'active' && sub?.plan === 'pro') {
            console.log('Pro subscription confirmed!')
            setSubscription(sub)
            return // Stop polling once we confirm pro status
          }
          
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(pollSubscription, pollInterval)
          } else {
            console.log('Max polling attempts reached without finding active pro subscription')
          }
        } catch (error) {
          console.error('Error during subscription polling:', error)
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(pollSubscription, pollInterval)
          }
        }
      }

      pollSubscription()
    }
  }, [refreshSubscription])

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Fetch subscription for the user
      await fetchSubscription(session?.user?.id ?? null)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Fetch subscription when user changes
        await fetchSubscription(session?.user?.id ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchSubscription])

  // Calculate features based on subscription
  const features = useMemo(() => {
    return getSubscriptionFeatures(subscription)
  }, [subscription])

  const value = {
    user,
    loading,
    subscription,
    subscriptionLoading,
    features,
    refreshSubscription,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 