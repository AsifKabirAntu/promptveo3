'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function TestOAuthRedirectPage() {
  const [oauthUrl, setOauthUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const generateOAuthUrl = async () => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      // First, let's check what the default redirectTo is
      console.log('🔍 Checking OAuth configuration...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback/debug',
          queryParams: {
            prompt: 'select_account'
          }
        }
      })
      
      if (error) {
        console.error('OAuth error:', error)
        alert('OAuth error: ' + error.message)
      } else {
        console.log('OAuth URL generated:', data.url)
        console.log('🔍 URL analysis:')
        console.log('- Contains redirect_to:', data.url.includes('redirect_to'))
        console.log('- Contains callback/debug:', data.url.includes('callback/debug'))
        console.log('- Full URL:', data.url)
        setOauthUrl(data.url)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">OAuth Redirect Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate OAuth URL</h2>
          
          <button
            onClick={generateOAuthUrl}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate OAuth URL'}
          </button>
          
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Testing Instructions</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900">Step 1: Generate OAuth URL</h3>
              <p className="text-gray-600">Click the button above to generate an OAuth URL</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Step 2: Complete OAuth Flow</h3>
              <p className="text-gray-600">Click the "Open OAuth URL" link and complete the Google OAuth flow</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Step 3: Check Redirect</h3>
              <p className="text-gray-600">You should be redirected to the debug page with a code parameter</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Step 4: Debug Information</h3>
              <p className="text-gray-600">Check the debug page for callback information and browser console for logs</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Expected Results</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs">✓</span>
              <span>OAuth URL generated successfully</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs">✓</span>
              <span>Google OAuth page loads</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs">✓</span>
              <span>Redirect to debug page with code parameter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs">✓</span>
              <span>Debug page shows code and processes it</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 