'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function DebugDataPage() {
  const auth = useAuth()
  const [directAuthCheck, setDirectAuthCheck] = useState<any>({ loading: true })
  const [promptsData, setPromptsData] = useState<any>({ loading: true })
  const [timelinePromptsData, setTimelinePromptsData] = useState<any>({ loading: true })
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({})
  const [cookiesData, setCookiesData] = useState<Record<string, string>>({})
  
  // Direct auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setDirectAuthCheck({
            loading: false,
            error: error.message
          })
          return
        }
        
        setDirectAuthCheck({
          loading: false,
          session: data.session,
          user: data.session?.user || null
        })
      } catch (error: any) {
        setDirectAuthCheck({
          loading: false,
          error: error.message || 'Unknown error'
        })
      }
    }
    
    checkAuth()
  }, [])
  
  // Get localStorage and cookies
  useEffect(() => {
    // Get localStorage
    const storage: Record<string, string> = {}
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        storage[key] = window.localStorage.getItem(key) || ''
      }
    }
    setLocalStorageData(storage)
    
    // Get cookies
    const cookies: Record<string, string> = {}
    document.cookie.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=')
      cookies[key] = value
    })
    setCookiesData(cookies)
  }, [])
  
  // Fetch prompts data
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase.from('prompts').select('*').limit(5)
        
        if (error) {
          setPromptsData({
            loading: false,
            error: error.message
          })
          return
        }
        
        setPromptsData({
          loading: false,
          data
        })
      } catch (error: any) {
        setPromptsData({
          loading: false,
          error: error.message || 'Unknown error'
        })
      }
    }
    
    fetchPrompts()
  }, [])
  
  // Fetch timeline prompts data
  useEffect(() => {
    const fetchTimelinePrompts = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase.from('timeline_prompts').select('*').limit(5)
        
        if (error) {
          setTimelinePromptsData({
            loading: false,
            error: error.message
          })
          return
        }
        
        setTimelinePromptsData({
          loading: false,
          data
        })
      } catch (error: any) {
        setTimelinePromptsData({
          loading: false,
          error: error.message || 'Unknown error'
        })
      }
    }
    
    fetchTimelinePrompts()
  }, [])
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Data</h1>
      
      {/* Auth State */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Auth State</h2>
        
        <div className="space-y-6">
          {/* Auth Provider */}
          <div>
            <h3 className="font-medium mb-2">Auth Provider:</h3>
            {auth.loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Loading...</span>
              </div>
            ) : auth.user ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-700">✅ Authenticated as {auth.user.email}</p>
                <pre className="bg-white p-3 rounded border border-green-100 text-sm overflow-auto mt-2">
                  {JSON.stringify({
                    id: auth.user.id,
                    email: auth.user.email,
                    role: auth.user.role,
                    app_metadata: auth.user.app_metadata,
                    user_metadata: auth.user.user_metadata
                  }, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700">❌ Not authenticated</p>
              </div>
            )}
          </div>
          
          {/* Direct Auth Check */}
          <div>
            <h3 className="font-medium mb-2">Direct Auth Check:</h3>
            {directAuthCheck.loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Checking...</span>
              </div>
            ) : directAuthCheck.error ? (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700">❌ Error: {directAuthCheck.error}</p>
              </div>
            ) : directAuthCheck.user ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-700">✅ Authenticated as {directAuthCheck.user.email}</p>
                <pre className="bg-white p-3 rounded border border-green-100 text-sm overflow-auto mt-2">
                  {JSON.stringify({
                    id: directAuthCheck.user.id,
                    email: directAuthCheck.user.email,
                    role: directAuthCheck.user.role
                  }, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">⚠️ No user found in direct check</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Data Fetching */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Data Fetching</h2>
        
        <div className="space-y-6">
          {/* Regular Prompts */}
          <div>
            <h3 className="font-medium mb-2">Regular Prompts:</h3>
            {promptsData.loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Loading prompts...</span>
              </div>
            ) : promptsData.error ? (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700">❌ Error: {promptsData.error}</p>
              </div>
            ) : promptsData.data?.length > 0 ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-700">✅ Found {promptsData.data.length} prompts</p>
                <pre className="bg-white p-3 rounded border border-green-100 text-sm overflow-auto mt-2 max-h-60">
                  {JSON.stringify(promptsData.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">⚠️ No prompts found</p>
              </div>
            )}
          </div>
          
          {/* Timeline Prompts */}
          <div>
            <h3 className="font-medium mb-2">Timeline Prompts:</h3>
            {timelinePromptsData.loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Loading timeline prompts...</span>
              </div>
            ) : timelinePromptsData.error ? (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700">❌ Error: {timelinePromptsData.error}</p>
              </div>
            ) : timelinePromptsData.data?.length > 0 ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-700">✅ Found {timelinePromptsData.data.length} timeline prompts</p>
                <pre className="bg-white p-3 rounded border border-green-100 text-sm overflow-auto mt-2 max-h-60">
                  {JSON.stringify(timelinePromptsData.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">⚠️ No timeline prompts found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Storage Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Storage Information</h2>
        
        <div className="space-y-6">
          {/* Cookies */}
          <div>
            <h3 className="font-medium mb-2">Cookies:</h3>
            {Object.keys(cookiesData).length > 0 ? (
              <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-sm overflow-auto max-h-60">
                {JSON.stringify(cookiesData, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No cookies found.</p>
            )}
          </div>
          
          {/* LocalStorage */}
          <div>
            <h3 className="font-medium mb-2">LocalStorage:</h3>
            {Object.keys(localStorageData).length > 0 ? (
              <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-sm overflow-auto max-h-60">
                {JSON.stringify(localStorageData, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No localStorage items found.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-4">
        <a 
          href="/dashboard" 
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-800"
        >
          Back to Dashboard
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
          Go to Auth Test Page
        </a>
      </div>
    </div>
  )
} 