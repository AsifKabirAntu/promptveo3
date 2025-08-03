'use client'

import { useEffect, useState } from 'react'

export default function CallbackDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    const state = params.get('state')
    
    const info = {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      code: code || 'No code',
      error: error || 'No error',
      state: state || 'No state',
      timestamp: new Date().toISOString()
    }
    
    setDebugInfo(info)
    
    console.log('🔍 Callback Debug Info:', info)
    
    // If we have a code, try to process it manually
    if (code && code !== 'No code') {
      console.log('✅ Code received, attempting manual processing...')
      processCode(code)
    }
  }, [])

  const processCode = async (code: string) => {
    try {
      console.log('🔄 Processing code manually...')
      
      // Try to exchange the code for a session
      const response = await fetch('/api/auth/exchange-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      })
      
      const result = await response.json()
      console.log('📋 Exchange result:', result)
      
      if (result.success) {
        console.log('✅ Code exchanged successfully')
        window.location.href = '/dashboard'
      } else {
        console.error('❌ Code exchange failed:', result.error)
      }
    } catch (err) {
      console.error('❌ Error processing code:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">OAuth Callback Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Callback Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full URL:</label>
              <p className="mt-1 text-sm text-gray-900 break-all bg-gray-50 p-2 rounded">{debugInfo.url}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Pathname:</label>
              <p className="mt-1 text-sm text-gray-900">{debugInfo.pathname}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Search Parameters:</label>
              <p className="mt-1 text-sm text-gray-900 break-all bg-gray-50 p-2 rounded">{debugInfo.search}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Code:</label>
              <p className="mt-1 text-sm text-gray-900 break-all bg-gray-50 p-2 rounded">{debugInfo.code}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Error:</label>
              <p className="mt-1 text-sm text-gray-900">{debugInfo.error}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">State:</label>
              <p className="mt-1 text-sm text-gray-900">{debugInfo.state}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Timestamp:</label>
              <p className="mt-1 text-sm text-gray-900">{debugInfo.timestamp}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Actions</h2>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                console.log('🔍 Current debug info:', debugInfo)
                console.log('🔍 Browser storage check:')
                console.log('localStorage:', localStorage.getItem('sb-hmqanqtadlvtweaoxmuf-auth-token'))
                console.log('sessionStorage:', sessionStorage.getItem('sb-hmqanqtadlvtweaoxmuf-auth-token'))
                console.log('cookies:', document.cookie)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Log Debug Info to Console
            </button>
            
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="ml-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go to Sign In
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Try Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 