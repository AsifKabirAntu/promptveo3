'use client'

import { useState } from 'react'

export default function TestOAuthManualPage() {
  const [oauthUrl, setOauthUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const generateManualOAuthUrl = async () => {
    setLoading(true)
    
    try {
      // Get Supabase URL from environment
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('🔍 Environment variables:')
      console.log('- Supabase URL:', supabaseUrl)
      console.log('- Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')
      
      if (!supabaseUrl) {
        alert('NEXT_PUBLIC_SUPABASE_URL is not set!')
        return
      }
      
      // Construct the OAuth URL manually
      const redirectTo = encodeURIComponent('http://localhost:3000/auth/callback/debug')
      const manualUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}&prompt=select_account`
      
      console.log('🔍 Manual OAuth URL:', manualUrl)
      setOauthUrl(manualUrl)
      
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const testSupabaseOAuth = async () => {
    setLoading(true)
    
    try {
      // Test with a different redirect URL
      const testRedirect = 'http://localhost:3000/auth/callback'
      console.log('🔍 Testing with redirect:', testRedirect)
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const redirectTo = encodeURIComponent(testRedirect)
      const testUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}&prompt=select_account`
      
      console.log('🔍 Test OAuth URL:', testUrl)
      setOauthUrl(testUrl)
      
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(oauthUrl)
    alert('OAuth URL copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manual OAuth URL Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Manual OAuth URL</h2>
          
          <div className="space-y-4">
            <button
              onClick={generateManualOAuthUrl}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mr-4"
            >
              {loading ? 'Generating...' : 'Generate Manual URL'}
            </button>
            
            <button
              onClick={testSupabaseOAuth}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test with /auth/callback'}
            </button>
          </div>
          
          {oauthUrl && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">OAuth URL:</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={oauthUrl}
                  readOnly
                  className="flex-1 p-2 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  Copy
                </button>
              </div>
              
              <div className="mt-4 space-y-2">
                <a
                  href={oauthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-4"
                >
                  Open in New Tab
                </a>
                
                <button
                  onClick={() => window.open(oauthUrl, '_blank')}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Open with window.open()
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Information</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900">Environment Variables</h3>
              <p className="text-gray-600">Check if NEXT_PUBLIC_SUPABASE_URL is set correctly</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">URL Analysis</h3>
              <p className="text-gray-600">Look at the console logs to see the generated URLs</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Expected Behavior</h3>
              <p className="text-gray-600">The URL should contain the redirect_to parameter with our debug callback</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Troubleshooting Steps</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">1</span>
              <span>Check browser console for environment variables</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">2</span>
              <span>Copy the OAuth URL and examine it</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">3</span>
              <span>Try opening in new tab vs window.open()</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">4</span>
              <span>Check if redirect_to parameter is present</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 