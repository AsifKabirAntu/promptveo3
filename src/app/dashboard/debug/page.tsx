'use client'

import { useAuth } from "@/components/auth/auth-provider"
import { useEffect, useState } from "react"

export default function DebugPage() {
  const { user, loading, subscription, subscriptionLoading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    // Collect debug information
    const info = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      windowSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      authState: {
        user: user ? {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata
        } : null,
        loading,
        subscription,
        subscriptionLoading
      },
      localStorage: {
        hasSupabaseAuth: !!localStorage.getItem('sb-hmqanqtadlvtweaoxmuf-auth-token'),
        supabaseAuthToken: localStorage.getItem('sb-hmqanqtadlvtweaoxmuf-auth-token') ? 'Present' : 'Missing'
      },
      sessionStorage: {
        hasSupabaseAuth: !!sessionStorage.getItem('sb-hmqanqtadlvtweaoxmuf-auth-token'),
        supabaseAuthToken: sessionStorage.getItem('sb-hmqanqtadlvtweaoxmuf-auth-token') ? 'Present' : 'Missing'
      }
    }
    setDebugInfo(info)
  }, [user, loading, subscription, subscriptionLoading])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Debug Information</h1>
        
        {/* Auth State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication State</h2>
          <div className="space-y-4">
            <div>
              <span className="font-medium">Loading:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {loading ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div>
              <span className="font-medium">User:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user ? 'Present' : 'Missing'}
              </span>
            </div>
            
            {user && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">User Details:</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">ID:</span> {user.id}</div>
                  <div><span className="font-medium">Email:</span> {user.email}</div>
                  <div><span className="font-medium">Name:</span> {user.user_metadata?.name || user.user_metadata?.full_name || 'Not set'}</div>
                  <div><span className="font-medium">Provider:</span> {user.app_metadata?.provider || 'Unknown'}</div>
                  <div><span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleString()}</div>
                  <div><span className="font-medium">Last Sign In:</span> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</div>
                </div>
              </div>
            )}
            
            <div>
              <span className="font-medium">Subscription Loading:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${subscriptionLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {subscriptionLoading ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div>
              <span className="font-medium">Subscription:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${subscription ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {subscription ? 'Present' : 'None (Free Plan)'}
              </span>
            </div>
          </div>
        </div>

        {/* Local Storage */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Local Storage</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Supabase Auth Token:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.localStorage?.hasSupabaseAuth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {debugInfo.localStorage?.supabaseAuthToken || 'Checking...'}
              </span>
            </div>
          </div>
        </div>

        {/* Session Storage */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Storage</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Supabase Auth Token:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.sessionStorage?.hasSupabaseAuth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {debugInfo.sessionStorage?.supabaseAuthToken || 'Checking...'}
              </span>
            </div>
          </div>
        </div>

        {/* Browser Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Browser Information</h2>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">User Agent:</span> {debugInfo.userAgent}</div>
            <div><span className="font-medium">Window Size:</span> {debugInfo.windowSize?.width} x {debugInfo.windowSize?.height}</div>
            <div><span className="font-medium">Timestamp:</span> {debugInfo.timestamp}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Actions</h2>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
            
            <button
              onClick={() => {
                localStorage.clear()
                sessionStorage.clear()
                window.location.reload()
              }}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear Storage & Reload
            </button>
            
            <button
              onClick={() => {
                console.log('Debug Info:', debugInfo)
                console.log('Auth State:', { user, loading, subscription, subscriptionLoading })
              }}
              className="ml-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Log to Console
            </button>
          </div>
        </div>

        {/* Raw Debug Data */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Raw Debug Data</h2>
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 