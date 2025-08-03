'use client'

import { useState } from 'react'

export default function TestOAuthCapturePage() {
  const [defaultUrl, setDefaultUrl] = useState<string>('')
  const [explicitUrl, setExplicitUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const captureOAuthUrls = async () => {
    setLoading(true)
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('🔍 Environment variables:')
      console.log('- Supabase URL:', supabaseUrl)
      console.log('- Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')
      
      if (!supabaseUrl) {
        alert('NEXT_PUBLIC_SUPABASE_URL is not set!')
        return
      }
      
      // Construct URLs manually to see what they should look like
      const defaultRedirectTo = encodeURIComponent('http://localhost:3000/auth/callback')
      const explicitRedirectTo = encodeURIComponent('http://localhost:3000/auth/callback')
      
      const defaultUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${defaultRedirectTo}&prompt=select_account`
      const explicitUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${explicitRedirectTo}&prompt=select_account`
      
      console.log('🔍 Manual default URL:', defaultUrl)
      console.log('🔍 Manual explicit URL:', explicitUrl)
      
      setDefaultUrl(defaultUrl)
      setExplicitUrl(explicitUrl)
      
      // Now let's try to fetch what Supabase actually generates
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${defaultRedirectTo}`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey || '',
            'Authorization': `Bearer ${supabaseAnonKey || ''}`
          }
        })
        
        console.log('🔍 Supabase response status:', response.status)
        console.log('🔍 Supabase response headers:', Object.fromEntries(response.headers.entries()))
        
        if (response.redirected) {
          console.log('🔍 Supabase redirected to:', response.url)
        }
      } catch (fetchError) {
        console.log('🔍 Fetch error (expected):', fetchError)
      }
      
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('OAuth URL copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">OAuth URL Capture Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Capture OAuth URLs</h2>
          
          <button
            onClick={captureOAuthUrls}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Capturing...' : 'Capture OAuth URLs'}
          </button>
          
          {(defaultUrl || explicitUrl) && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Default OAuth URL:</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={defaultUrl}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(defaultUrl)}
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
                
                <div className="mt-2">
                  <a
                    href={defaultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Test Default URL
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Explicit OAuth URL:</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={explicitUrl}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(explicitUrl)}
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
                
                <div className="mt-2">
                  <a
                    href={explicitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    Test Explicit URL
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What We're Testing</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900">Manual URL Construction</h3>
              <p className="text-gray-600">We're manually constructing OAuth URLs to see what they should look like</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Supabase Response Analysis</h3>
              <p className="text-gray-600">We're trying to fetch the OAuth endpoint to see what Supabase actually returns</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Expected Behavior</h3>
              <p className="text-gray-600">Both URLs should redirect to localhost after OAuth completion</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Information</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">1</span>
              <span>Check console for environment variables and URL construction</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">2</span>
              <span>Look for any Supabase response or redirect information</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">3</span>
              <span>Test both URLs to see where they redirect after OAuth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 