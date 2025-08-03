'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function TestCallbackPage() {
  const [urlParams, setUrlParams] = useState<Record<string, string>>({})
  const [hashParams, setHashParams] = useState<Record<string, string>>({})
  const [sessionCheck, setSessionCheck] = useState<{loading: boolean, session: any, error: any}>({
    loading: true,
    session: null,
    error: null
  })
  
  useEffect(() => {
    // Parse URL query parameters
    const searchParams = new URLSearchParams(window.location.search)
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    setUrlParams(params)
    
    // Parse URL hash parameters
    if (window.location.hash) {
      const hashSearchParams = new URLSearchParams(window.location.hash.substring(1))
      const hashParams: Record<string, string> = {}
      hashSearchParams.forEach((value, key) => {
        hashParams[key] = value
      })
      setHashParams(hashParams)
      
      // If we have an access token in the hash, try to set the session
      if (hashParams.access_token) {
        handleSetSession(hashParams)
      }
    }
    
    // Check current session
    checkSession()
  }, [])
  
  const checkSession = async () => {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.auth.getSession()
      
      setSessionCheck({
        loading: false,
        session: data.session,
        error
      })
    } catch (error: any) {
      setSessionCheck({
        loading: false,
        session: null,
        error: error.message || 'Unknown error'
      })
    }
  }
  
  const handleSetSession = async (params: Record<string, string>) => {
    try {
      const supabase = createClientComponentClient()
      
      const session = {
        access_token: params.access_token,
        refresh_token: params.refresh_token || '',
        expires_in: parseInt(params.expires_in || '3600', 10),
        expires_at: parseInt(params.expires_at || '0', 10),
        token_type: params.token_type || 'bearer'
      }
      
      const { error } = await supabase.auth.setSession(session)
      
      if (error) {
        throw error
      }
      
      // Check session after setting it
      await checkSession()
      
    } catch (error: any) {
      console.error('Error setting session:', error)
      alert(`Error setting session: ${error.message}`)
    }
  }
  
  const handleManuallySetSession = async () => {
    if (!hashParams.access_token) {
      alert('No access token found in URL hash')
      return
    }
    
    await handleSetSession(hashParams)
  }
  
  const handleSignOut = async () => {
    try {
      const supabase = createClientComponentClient()
      await supabase.auth.signOut()
      await checkSession()
    } catch (error: any) {
      console.error('Error signing out:', error)
      alert(`Error signing out: ${error.message}`)
    }
  }
  
  const handleClearStorage = () => {
    // Clear localStorage
    localStorage.clear()
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const [key] = cookie.trim().split('=')
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    })
    
    // Reload page
    window.location.reload()
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Callback Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* URL Parameters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">URL Parameters</h2>
          
          {Object.keys(urlParams).length > 0 ? (
            <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-sm overflow-auto">
              {JSON.stringify(urlParams, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No URL parameters found</p>
          )}
        </div>
        
        {/* Hash Parameters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Hash Parameters</h2>
          
          {Object.keys(hashParams).length > 0 ? (
            <>
              <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-sm overflow-auto mb-4">
                {JSON.stringify(hashParams, null, 2)}
              </pre>
              
              <button
                onClick={handleManuallySetSession}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Manually Set Session
              </button>
            </>
          ) : (
            <p className="text-gray-500">No hash parameters found</p>
          )}
        </div>
        
        {/* Session Check */}
        <div className="bg-white rounded-lg shadow p-6 col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Current Session</h2>
          
          {sessionCheck.loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Checking session...</span>
            </div>
          ) : sessionCheck.error ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-medium text-red-800 mb-2">Error:</h3>
              <p className="text-red-700">{sessionCheck.error}</p>
            </div>
          ) : sessionCheck.session ? (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">Authenticated:</h3>
              <pre className="bg-white p-3 rounded border border-green-100 text-sm overflow-auto">
                {JSON.stringify({
                  user: {
                    id: sessionCheck.session.user.id,
                    email: sessionCheck.session.user.email,
                    role: sessionCheck.session.user.role
                  },
                  expires_at: sessionCheck.session.expires_at,
                  access_token: sessionCheck.session.access_token ? 'Present' : 'Missing',
                  refresh_token: sessionCheck.session.refresh_token ? 'Present' : 'Missing'
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
      </div>
      
      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-4">
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
        <a 
          href="/auth-test" 
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
        >
          Go to Auth Test
        </a>
        <a 
          href="/test-oauth" 
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white"
        >
          Go to OAuth Test
        </a>
        <button
          onClick={handleClearStorage}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white"
        >
          Clear Storage
        </button>
      </div>
    </div>
  )
} 