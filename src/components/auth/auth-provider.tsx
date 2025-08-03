'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  const authInitialized = useRef(false)

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

    const initializeAuth = async () => {
      try {
        console.log('🔍 Initializing auth state...')
        
        // Try multiple methods to get the session
        let sessionUser = null
        
        // Method 1: Try localStorage first
        try {
          const sessionKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0]}-auth-token`
          const storedSession = localStorage.getItem(sessionKey)
          
          if (storedSession) {
            console.log('🔍 Found session in localStorage')
            const parsedSession = JSON.parse(storedSession)
            if (parsedSession?.user) {
              console.log('✅ User found in localStorage:', parsedSession.user.email)
              sessionUser = parsedSession.user
              
              // Also try to set the session with Supabase
              if (parsedSession?.access_token && parsedSession?.refresh_token) {
                try {
                  await supabase.auth.setSession({
                    access_token: parsedSession.access_token,
                    refresh_token: parsedSession.refresh_token
                  })
                  console.log('✅ Session set with Supabase client')
                } catch (e) {
                  console.error('❌ Error setting session with Supabase:', e)
                }
              }
            }
          }
        } catch (e) {
          console.log('ℹ️ Could not access localStorage:', e)
        }
        
        // Method 2: Try standard Supabase getSession if still no user
        if (!sessionUser) {
          try {
            console.log('🔍 Trying Supabase getSession')
            const { data, error } = await supabase.auth.getSession()
            
            if (error) {
              console.error('❌ Error getting session from Supabase:', error)
            } else if (data?.session?.user) {
              console.log('✅ User found via Supabase getSession:', data.session.user.email)
              sessionUser = data.session.user
            } else {
              console.log('ℹ️ No user session found via Supabase getSession')
            }
          } catch (e) {
            console.error('❌ Error with Supabase getSession:', e)
          }
        }
        
        // Final result
        if (sessionUser) {
          console.log('🔄 Auth state change: SIGNED_IN User:', sessionUser.email)
          console.log('✅ User signed in successfully')
          
          if (mounted) {
            setUser(sessionUser)
            authInitialized.current = true
            
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
          }
        } else {
          console.log('ℹ️ No user session found')
          if (mounted) {
            setUser(null)
            setSubscription(null)
            authInitialized.current = true
          }
        }
      } catch (error) {
        console.error('❌ Error in auth initialization:', error)
        if (mounted) {
          setUser(null)
          setSubscription(null)
          authInitialized.current = true
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setSubscriptionLoading(false)
        }
      }
    }

    // Initialize auth state
    initializeAuth()
    
    // Set a timeout to ensure loading state doesn't get stuck
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Auth initialization timed out - this is not an error, just means the auth check took longer than expected')
        // Only set loading to false, but don't change the user state
        // This way we don't overwrite a successful auth that just took longer than expected
        setLoading(false)
        setSubscriptionLoading(false)
      }
    }, 15000) // 15 second timeout (increased from 10s)

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state change:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in successfully')
          setUser(session.user)
          authInitialized.current = true
          
          // Fetch subscription data
          getUserSubscriptionClient()
            .then((sub) => {
              if (mounted) {
                setSubscription(sub)
              }
            })
            .catch((error) => {
              console.error('❌ Error fetching subscription:', error)
              if (mounted) {
                setSubscription(null)
              }
            })
            .finally(() => {
              if (mounted) {
                setLoading(false)
                setSubscriptionLoading(false)
              }
            })
        } else if (event === 'SIGNED_OUT') {
          console.log('ℹ️ User signed out')
          setUser(null)
          setSubscription(null)
          setLoading(false)
          setSubscriptionLoading(false)
          authInitialized.current = true
        } else if (event === 'USER_UPDATED') {
          console.log('ℹ️ User updated')
          if (session?.user) {
            setUser(session.user)
            authInitialized.current = true
          }
        }
      }
    )

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      authSubscription.unsubscribe()
    }
  }, [])

  // Compute subscription features
  const features = getSubscriptionFeatures(subscription)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        subscription,
        subscriptionLoading,
        features,
        refreshSubscription,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
} 