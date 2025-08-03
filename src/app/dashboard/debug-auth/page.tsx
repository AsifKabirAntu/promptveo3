'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export default function DebugAuthPage() {
  const { user, loading } = useAuth()
  const [sessionData, setSessionData] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    // Check session directly
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      setSessionData({ session, error })
    }

    // Get cookies
    setCookies(document.cookie)

    checkSession()
  }, [supabase.auth])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Auth Provider State</h2>
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Direct Session Check</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(sessionData, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Browser Cookies</h2>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {cookies}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Local Storage</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(localStorage.getItem('supabase.auth.token'), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 