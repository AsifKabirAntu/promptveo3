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

  // Modify the refreshSubscription function to include a debounce
  const refreshSubscription = async () => {
    // Prevent multiple quick refreshes
    if (subscriptionLoading) {
      return
    }
    
    if (user?.id) {
      try {
        setSubscriptionLoading(true)
        const sub = await getUserSubscriptionClient()
        setSubscription(sub)
      } catch (error) {
        console.error('Error refreshing subscription:', error)
        setSubscription(null)
      } finally {
        setSubscriptionLoading(false)
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
      
      // Force reload to ensure all state is cleared
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      try {
        // Try multiple methods to get the session
        let sessionUser = null
        
        // Method 1: Try localStorage first
        try {
          const sessionKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0]}-auth-token`
          const storedSession = localStorage.getItem(sessionKey)
          
          if (storedSession) {
            const parsedSession = JSON.parse(storedSession)
            if (parsedSession?.user) {
              sessionUser = parsedSession.user
              
              // Also try to set the session with Supabase
              if (parsedSession?.access_token && parsedSession?.refresh_token) {
                try {
                  await supabase.auth.setSession({
                    access_token: parsedSession.access_token,
                    refresh_token: parsedSession.refresh_token
                  })
                } catch (e) {
                  console.error('Error setting session with Supabase:', e)
                }
              }
            }
          }
        } catch (e) {
          // Silent fail for localStorage access
        }
        
        // Method 2: Try standard Supabase getSession if still no user
        if (!sessionUser) {
          try {
            const { data, error } = await supabase.auth.getSession()
            
            if (error) {
              console.error('Error getting session from Supabase:', error)
            } else if (data?.session?.user) {
              sessionUser = data.session.user
            }
          } catch (e) {
            console.error('Error with Supabase getSession:', e)
          }
        }
        
        // Final result
        if (sessionUser) {
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
              console.error('Error fetching subscription:', error)
              if (mounted) {
                setSubscription(null)
              }
            }
          }
        } else {
          if (mounted) {
            setUser(null)
            setSubscription(null)
            authInitialized.current = true
          }
        }
      } catch (error) {
        console.error('Error in auth initialization:', error)
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
        // Only set loading to false, but don't change the user state
        setLoading(false)
        setSubscriptionLoading(false)
      }
    }, 15000) // 15 second timeout (increased from 10s)

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
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
              console.error('Error fetching subscription:', error)
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
          setUser(null)
          setSubscription(null)
          setLoading(false)
          setSubscriptionLoading(false)
          authInitialized.current = true
        } else if (event === 'USER_UPDATED') {
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