'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export default function TestSessionPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const checkSession = async () => {
      console.log('=== Testing Session Directly ===')
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Direct session check:', { session: !!session, error, userId: session?.user?.id })
        setSession({ session, error })
      } catch (err) {
        console.error('Session check error:', err)
        setSession({ error: err })
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [supabase.auth])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Direct Session Test</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Session Data</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Browser Cookies</h2>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {document.cookie}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Local Storage</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              'supabase.auth.token': localStorage.getItem('supabase.auth.token'),
              'supabase.auth.expires_at': localStorage.getItem('supabase.auth.expires_at'),
              'supabase.auth.refresh_token': localStorage.getItem('supabase.auth.refresh_token')
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 