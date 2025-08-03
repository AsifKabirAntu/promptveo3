'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-browser'
import { getUserSubscriptionClient, getSubscriptionFeatures } from '@/lib/subscriptions'

interface AuthContextType {
  user: User | null
  loading: boolean
  subscription: any
  subscriptionLoading: boolean
  features: any
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
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const supabase = createClient()

  const refreshSubscription = async () => {
    if (user?.id) {
      try {
        const sub = await getUserSubscriptionClient()
        setSubscription(sub)
      } catch (error) {
        console.error('Error refreshing subscription:', error)
        setSubscription(null)
      }
    }
  }

  const signOut = async () => {
    try {
      // Sign out with Supabase (this should clear cookies)
      await supabase.auth.signOut()
      
      // Update state
      setUser(null)
      setSubscription(null)
      
      console.log('✅ Signed out successfully')
      
      // Force reload to ensure all state is cleared
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('❌ Error signing out:', error)
    }
  }

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null
    let retryCount = 0
    const maxRetries = 3

    const initializeAuth = async (retry = false) => {
      try {
        console.log(`🔍 Initializing auth state... ${retry ? `(Retry ${retryCount}/${maxRetries})` : ''}`)
        
        // First try to get session from localStorage directly
        try {
          const sessionKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0]}-auth-token`
          const storedSession = localStorage.getItem(sessionKey)
          
          if (storedSession) {
            console.log('🔍 Found session in localStorage, attempting to use it')
            try {
              const parsedSession = JSON.parse(storedSession)
              if (parsedSession?.access_token && parsedSession?.refresh_token) {
                console.log('🔄 Setting session from localStorage')
                await supabase.auth.setSession({
                  access_token: parsedSession.access_token,
                  refresh_token: parsedSession.refresh_token
                })
              }
            } catch (e) {
              console.error('❌ Error parsing or using stored session:', e)
            }
          }
        } catch (e) {
          console.log('ℹ️ Could not access localStorage')
        }
        
        // Get the current session from Supabase
        const { data, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('❌ Error getting session:', error)
          
          // Try again if we haven't exceeded max retries
          if (retry && retryCount < maxRetries) {
            retryCount++
            console.log(`Retrying auth initialization (${retryCount}/${maxRetries})...`)
            // Wait a second before retrying
            setTimeout(() => initializeAuth(true), 1000)
            return
          }
          
          // Even with an error, we should set loading to false
          setLoading(false)
          setSubscriptionLoading(false)
          return
        }

        if (data.session?.user) {
          console.log('✅ User authenticated from Supabase session:', data.session.user.email)
          setUser(data.session.user)
          
          // Fetch subscription data
          try {
            const sub = await getUserSubscriptionClient()
            if (mounted) {
              setSubscription(sub)
            }
          } catch (error) {
            console.error('❌ Error fetching subscription:', error)
            if (mounted) {
              setSubscription(null)
            }
          }
          
          // Success - set loading to false
          if (mounted) {
            setLoading(false)
            setSubscriptionLoading(false)
          }
        } else {
          console.log('ℹ️  No user session found')
          
          // Try again if we haven't exceeded max retries
          if (retry && retryCount < maxRetries) {
            retryCount++
            console.log(`Retrying auth initialization (${retryCount}/${maxRetries})...`)
            // Wait a second before retrying
            setTimeout(() => initializeAuth(true), 1000)
            return
          }
          
          setUser(null)
          setSubscription(null)
          setLoading(false)
          setSubscriptionLoading(false)
        }
        
      } catch (error) {
        console.error('❌ Error in auth initialization:', error)
        if (mounted) {
          setUser(null)
          setSubscription(null)
          setLoading(false)
          setSubscriptionLoading(false)
        }
      }
    }

    // Initialize auth state with retry enabled
    initializeAuth(true)
    
    // Set a timeout to ensure loading state doesn't get stuck
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Auth initialization timed out')
        setLoading(false)
        setSubscriptionLoading(false)
      }
    }, 8000) // 8 second timeout

    // Listen for auth changes
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log(`🔄 Auth state change: ${event}`, session ? `User: ${session.user.email}` : 'No user')

        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in successfully')
          setUser(session?.user ?? null)
          
          if (session?.user?.id) {
            try {
              const sub = await getUserSubscriptionClient()
              if (mounted) {
                setSubscription(sub)
              }
            } catch (error) {
              console.error('❌ Error fetching subscription:', error)
              if (mounted) {
                setSubscription(null)
              }
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
          setUser(null)
          setSubscription(null)
          // Clear localStorage
          const sessionKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0]}-auth-token`
          localStorage.removeItem(sessionKey)
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed')
          setUser(session?.user ?? null)
        }

        setLoading(false)
        setSubscriptionLoading(false)
      }
    )

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      authListener.unsubscribe()
    }
  }, [])

  // Import getSubscriptionFeatures from subscriptions.ts
  const features = getSubscriptionFeatures(subscription)

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