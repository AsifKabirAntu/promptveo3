'use client'

import { useState } from 'react'

export default function TestOAuthSimplePage() {
  const [oauthUrl, setOauthUrl] = useState<string>('')

  const generateOAuthUrl = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const redirectTo = encodeURIComponent('http://localhost:3000/auth/callback')
    
    const url = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}&prompt=select_account`
    
    console.log('🔍 Generated OAuth URL:', url)
    setOauthUrl(url)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(oauthUrl)
    alert('OAuth URL copied to clipboard!')
  }

  const openInNewTab = () => {
    window.open(oauthUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Simple OAuth Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate OAuth URL</h2>
          
          <button
            onClick={generateOAuthUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generate OAuth URL
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
              
              <div className="mt-4 space-y-2">
                <button
                  onClick={openInNewTab}
                  className="block w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Open OAuth URL in New Tab
                </button>
                
                <div className="text-sm text-gray-600 text-center">
                  <p>This will open Google OAuth in a new tab</p>
                  <p>After completing OAuth, you should be redirected to the callback test page</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What to Expect</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900">Step 1: Generate URL</h3>
              <p className="text-gray-600">Click "Generate OAuth URL" to create the OAuth URL</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Step 2: Open OAuth</h3>
              <p className="text-gray-600">Click "Open OAuth URL in New Tab" to start the OAuth flow</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Step 3: Complete OAuth</h3>
              <p className="text-gray-600">Sign in with Google in the new tab</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Step 4: Check Redirect</h3>
              <p className="text-gray-600">You should be redirected to the callback test page with a code parameter</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Information</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">1</span>
              <span>Check console for the generated OAuth URL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">2</span>
              <span>Look for redirect_to parameter in the URL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">3</span>
              <span>After OAuth, check what URL you end up on</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 