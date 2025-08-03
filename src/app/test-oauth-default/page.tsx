'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function TestOAuthDefaultPage() {
  const [oauthUrl, setOauthUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const generateDefaultOAuthUrl = async () => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      console.log('🔍 Testing default OAuth redirect...')
      console.log('🔍 Site URL from env:', process.env.NEXT_PUBLIC_SITE_URL)
      
      // Test without specifying redirectTo to see what the default is
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account'
          }
        }
      })
      
      if (error) {
        console.error('OAuth error:', error)
        alert('OAuth error: ' + error.message)
      } else {
        console.log('🔍 Default OAuth URL:', data.url)
        console.log('🔍 URL analysis:')
        console.log('- Contains redirect_to:', data.url.includes('redirect_to'))
        console.log('- Contains localhost:', data.url.includes('localhost'))
        console.log('- Contains production URL:', data.url.includes('promptveo3'))
        console.log('- Full URL:', data.url)
        setOauthUrl(data.url)
        
        // Don't redirect immediately - let user see the URL first
        alert('Default OAuth URL generated! Check console for details. Click "Open OAuth URL" to test.')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const generateWithExplicitRedirect = async () => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      console.log('🔍 Testing with explicit localhost redirect...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          queryParams: {
            prompt: 'select_account'
          }
        }
      })
      
      if (error) {
        console.error('OAuth error:', error)
        alert('OAuth error: ' + error.message)
      } else {
        console.log('🔍 Explicit redirect OAuth URL:', data.url)
        console.log('🔍 URL analysis:')
        console.log('- Contains redirect_to:', data.url.includes('redirect_to'))
        console.log('- Contains localhost:', data.url.includes('localhost'))
        console.log('- Contains /auth/callback:', data.url.includes('auth/callback'))
        console.log('- Full URL:', data.url)
        setOauthUrl(data.url)
        
        // Don't redirect immediately - let user see the URL first
        alert('Explicit localhost OAuth URL generated! Check console for details. Click "Open OAuth URL" to test.')
      }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Default OAuth Redirect Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test OAuth Redirects</h2>
          
          <div className="space-y-4">
            <button
              onClick={generateDefaultOAuthUrl}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 mr-4"
            >
              {loading ? 'Testing...' : 'Test Default Redirect'}
            </button>
            
            <button
              onClick={generateWithExplicitRedirect}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Explicit Localhost'}
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
              
              <div className="mt-4">
                <a
                  href={oauthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Open OAuth URL in New Tab
                </a>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What We're Testing</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900">Default Redirect Test</h3>
              <p className="text-gray-600">See what URL Supabase uses by default when no redirectTo is specified</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Explicit Localhost Test</h3>
              <p className="text-gray-600">Force Supabase to use localhost:3000 as the redirect URL</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Expected Results</h3>
              <p className="text-gray-600">The explicit localhost URL should redirect back to localhost after OAuth</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Information</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">1</span>
              <span>Check console for URL analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">2</span>
              <span>Compare default vs explicit redirect URLs</span>
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