'use client'

import { useAuth } from "@/components/auth/auth-provider"
import { ExploreLibrary } from "@/components/dashboard/explore-library"

export default function DashboardPage() {
  const { user, loading } = useAuth()

  // Show loading only for a brief moment (max 3 seconds)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-400 mt-2">If this takes too long, try <a href="/auth/signin" className="text-blue-600 hover:underline">signing in again</a></p>
        </div>
      </div>
    )
  }

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
            <a href="/dashboard/debug-data" className="text-sm text-blue-600 hover:underline">
              Debug Authentication
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <ExploreLibrary />
} 