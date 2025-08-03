'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [oauthUrl, setOauthUrl] = useState<string | null>(null)
  
  const handleGenerateOAuthUrl = async () => {
    setLoading(true)
    setError(null)
    setOauthUrl(null)
    
    try {
      const supabase = createClientComponentClient()
      
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
        setError(error.message)
        return
      }
      
      if (data?.url) {
        setOauthUrl(data.url)
      } else {
        setError('No OAuth URL generated')
      }
      
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  const handleOpenOAuthUrl = () => {
    if (oauthUrl) {
      window.open(oauthUrl, '_blank')
    }
  }
  
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test OAuth Flow</h1>
      
      <div className="space-y-4">
        <button
          onClick={handleGenerateOAuthUrl}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate OAuth URL'}
        </button>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {oauthUrl && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="font-medium text-green-800 mb-2">OAuth URL Generated:</p>
              <div className="bg-white p-3 rounded border border-green-100 text-sm break-all">
                {oauthUrl}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleOpenOAuthUrl}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Open in New Tab
              </button>
              
              <a
                href={oauthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Open as Link
              </a>
            </div>
          </div>
        )}
        
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h2 className="font-medium mb-2">Environment Variables:</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Supabase URL:</span>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}
            </p>
            <p>
              <span className="font-medium">Supabase Anon Key:</span>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Not set'}
            </p>
            <p>
              <span className="font-medium">Site URL:</span>{' '}
              {process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 