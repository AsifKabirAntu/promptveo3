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
    try {
      console.log('Refreshing subscription data for user:', user.id)
      const sub = await getUserSubscriptionClient()
      console.log('Refreshed subscription data:', sub)
      setSubscription(sub)
    } catch (error) {
      console.error('Error refreshing subscription:', error)
      setSubscription(null)
    } finally {
      setSubscriptionLoading(false)
    }
  }, [user?.id])

  // Sign out function
  const signOut = useCallback(async () => {
    console.log('Sign out initiated...')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      } else {
        console.log('Sign out successful')
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [supabase.auth])

  // Poll for subscription updates when returning from Stripe
  useEffect(() => {
    // Check if we just completed a checkout (either via URL or sessionStorage)
    const hasCompletedCheckout = window.location.search.includes('success=true') || 
                                sessionStorage.getItem('checkout_completed') === 'true'
    
    if (hasCompletedCheckout) {
      // Clear the sessionStorage flag
      sessionStorage.removeItem('checkout_completed')
      
      let attempts = 0
      const maxAttempts = 15 // Increased to 15 attempts
      const pollInterval = 1000 // 1 second

      const pollSubscription = async () => {
        try {
          const sub = await getUserSubscriptionClient()
          
          if (sub?.status === 'active') {
            setSubscription(sub)
            return // Stop polling once we confirm active status
          }
          
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(pollSubscription, pollInterval)
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
  }, [])

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Fetch subscription for the user
      if (session?.user?.id) {
        try {
          const sub = await getUserSubscriptionClient()
          setSubscription(sub)
        } catch (error) {
          console.error('Error fetching initial subscription:', error)
          setSubscription(null)
        } finally {
          setSubscriptionLoading(false)
        }
      } else {
        setSubscription(null)
        setSubscriptionLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Fetch subscription when user changes
        if (session?.user?.id) {
          try {
            const sub = await getUserSubscriptionClient()
            setSubscription(sub)
          } catch (error) {
            console.error('Error fetching subscription on auth change:', error)
            setSubscription(null)
          } finally {
            setSubscriptionLoading(false)
          }
        } else {
          setSubscription(null)
          setSubscriptionLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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