'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function TestOAuthFinalPage() {
  const [oauthUrl, setOauthUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const testOAuthFlow = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const supabase = createClient()
      
      console.log('🔍 Testing OAuth flow with explicit localhost redirect...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback/test',
          queryParams: {
            prompt: 'select_account'
          }
        }
      })
      
      if (error) {
        console.error('OAuth error:', error)
        setResult(`Error: ${error.message}`)
      } else {
        console.log('✅ OAuth URL generated:', data.url)
        setOauthUrl(data.url)
        setResult('OAuth URL generated successfully! Click the link below to test.')
        
        // Parse the URL to show what's in it
        const url = new URL(data.url)
        const redirectTo = url.searchParams.get('redirect_to')
        const state = url.searchParams.get('state')
        
        console.log('🔍 URL Analysis:')
        console.log('- redirect_to:', redirectTo)
        console.log('- state present:', !!state)
        console.log('- Full URL:', data.url)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setResult(`Unexpected error: ${err}`)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Final OAuth Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test OAuth Flow</h2>
          
          <button
            onClick={testOAuthFlow}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate OAuth URL'}
          </button>
          
          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">{result}</p>
            </div>
          )}
          
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
                        <div className="space-y-2">
          <button
            onClick={() => {
              const newWindow = window.open(oauthUrl, '_blank')
              if (newWindow) {
                console.log('Opened OAuth URL in new window')
              }
            }}
            className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test OAuth Flow (New Window)
          </button>
          
          <div className="text-sm text-gray-600">
            <p>Or copy the URL above and paste it in a new tab</p>
          </div>
        </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Expected Flow</h2>
          
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Click "Generate OAuth URL" to create the OAuth URL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Click "Test OAuth Flow" to open Google OAuth</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Complete Google OAuth (sign in with Google)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Google redirects to Supabase callback</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <span>Supabase processes the code and redirects to localhost:3000/auth/callback</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">6</span>
              <span>Our callback route sets cookies and redirects to dashboard</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What to Check</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs">✓</span>
              <span>OAuth URL contains redirect_to=localhost:3000</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs">✓</span>
              <span>After OAuth, you're redirected to localhost:3000/auth/callback</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs">✓</span>
              <span>Callback page shows code parameter in URL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs">✓</span>
              <span>You end up on dashboard with user info displayed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 