'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { createClient } from '@/lib/supabase-browser'
import { getAllPromptsClient } from '@/lib/prompts-client'
import { getUserSubscriptionClient } from '@/lib/subscriptions'

export function DebugDashboard() {
  const { user, loading, subscription, subscriptionLoading, features } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testResults, setTestResults] = useState<any>({})

  useEffect(() => {
    async function runTests() {
      const supabase = createClient()
      const tests: any = {
        timestamp: new Date().toISOString(),
        userAuth: null,
        dbConnection: null,
        promptsFetch: null,
        subscriptionFetch: null,
        profileCheck: null
      }

      try {
        // Test 1: Check current session
        console.log('Testing session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        tests.userAuth = {
          success: !sessionError,
          session: !!session,
          user: !!session?.user,
          error: sessionError?.message
        }
        console.log('Session test result:', tests.userAuth)

        // Test 2: Test database connection
        console.log('Testing database connection...')
        const { data: dbTest, error: dbError } = await supabase
          .from('prompts')
          .select('count(*)')
          .limit(1)
          .single()
        
        tests.dbConnection = {
          success: !dbError,
          result: dbTest,
          error: dbError?.message
        }
        console.log('DB connection test result:', tests.dbConnection)

        // Test 3: Test prompts fetching
        console.log('Testing prompts fetch...')
        try {
          const prompts = await getAllPromptsClient()
          tests.promptsFetch = {
            success: true,
            count: prompts.length,
            error: null
          }
        } catch (error: any) {
          tests.promptsFetch = {
            success: false,
            count: 0,
            error: error.message
          }
        }
        console.log('Prompts fetch test result:', tests.promptsFetch)

        // Test 4: Test subscription fetching
        if (session?.user) {
          console.log('Testing subscription fetch...')
          try {
            const sub = await getUserSubscriptionClient()
            tests.subscriptionFetch = {
              success: true,
              subscription: sub,
              error: null
            }
          } catch (error: any) {
            tests.subscriptionFetch = {
              success: false,
              subscription: null,
              error: error.message
            }
          }
          console.log('Subscription fetch test result:', tests.subscriptionFetch)

          // Test 5: Test profile check
          console.log('Testing profile check...')
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .single()
          
          tests.profileCheck = {
            success: !profileError,
            exists: !!profile,
            error: profileError?.message
          }
          console.log('Profile check test result:', tests.profileCheck)
        }

      } catch (error: any) {
        console.error('Error running tests:', error)
        tests.globalError = error.message
      }

      setTestResults(tests)
    }

    runTests()
  }, [])

  useEffect(() => {
    setDebugInfo({
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      loading,
      subscription,
      subscriptionLoading,
      features
    })
  }, [user, loading, subscription, subscriptionLoading, features])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth State</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          {/* Test Results */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg text-center ${loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            <div className="font-semibold">Auth Loading</div>
            <div>{loading ? 'Loading...' : 'Complete'}</div>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${subscriptionLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            <div className="font-semibold">Subscription Loading</div>
            <div>{subscriptionLoading ? 'Loading...' : 'Complete'}</div>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="font-semibold">User</div>
            <div>{user ? 'Authenticated' : 'Not authenticated'}</div>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${testResults.dbConnection?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="font-semibold">Database</div>
            <div>{testResults.dbConnection?.success ? 'Connected' : 'Error'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Normal Dashboard
          </button>
        </div>
      </div>
    </div>
  )
} 