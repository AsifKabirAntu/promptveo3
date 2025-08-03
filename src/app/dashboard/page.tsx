'use client'

import { useAuth } from "@/components/auth/auth-provider"
import { ExploreLibrary } from "@/components/dashboard/explore-library"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user, loading } = useAuth()

  // Log auth state for debugging
  useEffect(() => {
    console.log("Dashboard auth state:", { user: user?.email || null, loading })
  }, [user, loading])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        {/* Skeleton loader */}
        <div className="w-full max-w-4xl mx-auto p-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="h-40 bg-gray-200 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-500 mt-4">Loading dashboard...</p>
        <p className="text-sm text-gray-400 mt-2">If this takes too long, try <a href="/auth/signin" className="text-blue-600 hover:underline">signing in again</a></p>
      </div>
    )
  }

  // Show unauthenticated state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">You need to sign in to access the dashboard.</p>
          <button 
            onClick={() => window.location.href = '/auth/signin'}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </button>
          <div className="mt-4">
            <a href="/auth-test" className="text-sm text-blue-600 hover:underline">
              Debug Authentication
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <ExploreLibrary />
} 