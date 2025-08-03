'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function HandleFragmentPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleFragment = async () => {
      try {
        // Get the hash fragment from the URL
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const expiresIn = params.get('expires_in')
        const expiresAt = params.get('expires_at')
        const tokenType = params.get('token_type')
        
        if (!accessToken) {
          throw new Error('No access token found in URL fragment')
        }
        
        console.log('🔍 Fragment handler received tokens:', { 
          accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : 'none',
          hasRefreshToken: !!refreshToken,
          expiresIn
        })
        
        // Create a session object
        const session = {
          access_token: accessToken,
          refresh_token: refreshToken || '',
          expires_in: parseInt(expiresIn || '3600', 10),
          expires_at: parseInt(expiresAt || '0', 10),
          token_type: tokenType || 'bearer'
        }
        
        // Get Supabase client
        const supabase = createClientComponentClient()
        
        // Set the session in Supabase
        console.log('Setting session via Supabase client...')
        const { error: setSessionError } = await supabase.auth.setSession(session)
        
        if (setSessionError) {
          console.error('❌ Error setting session via Supabase client:', setSessionError)
          throw setSessionError
        }
        
        console.log('✅ Session set successfully via Supabase client')
        
        // Also store in localStorage manually as a backup
        try {
          // Get the correct key for localStorage
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          if (!supabaseUrl) {
            throw new Error('Supabase URL not found in environment variables')
          }
          
          const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`
          console.log('Using storage key:', storageKey)
          
          // Create a full session object with user data
          const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
          
          if (userError) {
            console.error('❌ Error getting user data:', userError)
          }
          
          if (userData?.user) {
            const fullSession = {
              ...session,
              user: userData.user
            }
            
            // Store in localStorage
            localStorage.setItem(storageKey, JSON.stringify(fullSession))
            console.log('✅ Session stored in localStorage')
          }
        } catch (storageError: any) {
          console.error('❌ Error storing session in localStorage:', storageError)
          // Continue even if localStorage fails
        }
        
        // Verify the session was set
        const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession()
        
        if (verifyError) {
          console.error('❌ Error verifying session:', verifyError)
          throw verifyError
        }
        
        if (!verifySession) {
          throw new Error('Session could not be verified after setting')
        }
        
        console.log('✅ Session verified for user:', verifySession.user.email)
        setStatus('success')
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
        
      } catch (error: any) {
        console.error('❌ Error handling fragment:', error)
        setError(error.message || 'Unknown error')
        setStatus('error')
        
        // Redirect to sign-in after a short delay
        setTimeout(() => {
          router.push(`/auth/signin?error=${encodeURIComponent(error.message || 'fragment_error')}`)
        }, 3000)
      }
    }
    
    handleFragment()
  }, [router])
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Authentication</h1>
        
        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p>Setting up your session...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h2 className="font-medium text-green-800 mb-2">Success!</h2>
            <p className="text-green-700">Authentication successful. Redirecting to dashboard...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h2 className="font-medium text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <p className="mt-2">Redirecting to sign in page...</p>
          </div>
        )}
      </div>
    </div>
  )
} 