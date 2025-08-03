'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function AuthTestPage() {
  const [authState, setAuthState] = useState<any>({
    loading: true,
    user: null,
    error: null,
    cookies: {},
    localStorage: {},
    supabaseUrl: '',
    supabaseKey: ''
  })
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  const [signInSuccess, setSignInSuccess] = useState<string | null>(null)
  
  // Get environment variables
  useEffect(() => {
    setAuthState((prev: any) => ({
      ...prev,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not found',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Not found'
    }))
  }, [])
  
  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase environment variables')
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        // Get current session
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }
        
        // Get cookies
        const cookies: Record<string, string> = {}
        document.cookie.split(';').forEach(cookie => {
          const [key, value] = cookie.trim().split('=')
          cookies[key] = value
        })
        
        // Get localStorage
        const localStorage: Record<string, string> = {}
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key) {
            localStorage[key] = window.localStorage.getItem(key) || ''
          }
        }
        
        setAuthState({
          loading: false,
          user: data.session?.user || null,
          session: data.session,
          error: null,
          cookies,
          localStorage,
          supabaseUrl,
          supabaseKey: 'Present'
        })
        
      } catch (error: any) {
        setAuthState((prev: any) => ({
          ...prev,
          loading: false,
          error: error.message || 'Unknown error'
        }))
      }
    }
    
    checkAuth()
  }, [])
  
  // Handle email/password sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInLoading(true)
    setSignInError(null)
    setSignInSuccess(null)
    
    try {
      // Get Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw error
      }
      
      setSignInSuccess(`Signed in as ${data.user?.email}`)
      
      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error: any) {
      setSignInError(error.message || 'Unknown error')
    } finally {
      setSignInLoading(false)
    }
  }
  
  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    try {
      // Get Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Sign in with Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      })
      
      if (error) {
        throw error
      }
      
      // No need to handle success here as we'll be redirected
      
    } catch (error: any) {
      setSignInError(error.message || 'Unknown error')
    }
  }
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      // Get Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Sign out
      await supabase.auth.signOut()
      
      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error: any) {
      setSignInError(error.message || 'Unknown error')
    }
  }
  
  // Clear all auth data
  const handleClearAuth = () => {
    // Clear localStorage
    localStorage.clear()
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const [key] = cookie.trim().split('=')
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    })
    
    // Refresh page after 1 second
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      {/* Environment Variables */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Supabase URL:</span> {authState.supabaseUrl}
          </div>
          <div>
            <span className="font-medium">Supabase Key:</span> {authState.supabaseKey}
          </div>
        </div>
      </div>
      
      {/* Auth State */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Auth State</h2>
        
        {authState.loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Checking authentication...</span>
          </div>
        ) : authState.error ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-medium text-red-800 mb-2">Error:</h3>
            <p className="text-red-700">{authState.error}</p>
          </div>
        ) : authState.user ? (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Authenticated:</h3>
            <pre className="bg-white p-3 rounded border border-green-100 text-sm overflow-auto">
              {JSON.stringify({
                id: authState.user.id,
                email: authState.user.email,
                role: authState.user.role,
                app_metadata: authState.user.app_metadata,
                user_metadata: authState.user.user_metadata
              }, null, 2)}
            </pre>
            
            <div className="mt-4">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-yellow-800 mb-2">Not Authenticated</h3>
            <p className="text-yellow-700">No user session found.</p>
          </div>
        )}
      </div>
      
      {/* Sign In Form */}
      {!authState.user && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sign In</h2>
          
          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign in with email</span>
            </div>
          </div>
          
          <form onSubmit={handleSignIn} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {signInError && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="text-red-700 text-sm">{signInError}</p>
              </div>
            )}
            
            {signInSuccess && (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-green-700 text-sm">{signInSuccess}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={signInLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {signInLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      )}
      
      {/* Storage Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Storage Information</h2>
        
        <div className="space-y-6">
          {/* Cookies */}
          <div>
            <h3 className="font-medium mb-2">Cookies:</h3>
            {Object.keys(authState.cookies).length > 0 ? (
              <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-sm overflow-auto max-h-60">
                {JSON.stringify(authState.cookies, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No cookies found.</p>
            )}
          </div>
          
          {/* LocalStorage */}
          <div>
            <h3 className="font-medium mb-2">LocalStorage:</h3>
            {Object.keys(authState.localStorage).length > 0 ? (
              <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-sm overflow-auto max-h-60">
                {JSON.stringify(authState.localStorage, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No localStorage items found.</p>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={handleClearAuth}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Clear All Auth Data
          </button>
        </div>
      </div>
      
      {/* Links */}
      <div className="flex gap-4">
        <a 
          href="/dashboard" 
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-800"
        >
          Go to Dashboard
        </a>
        <a 
          href="/auth/signin" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Go to Sign In
        </a>
      </div>
    </div>
  )
} 