'use client'

import { useAuth } from "@/components/auth/auth-provider"

export default function SimpleDashboard() {
  const { user, loading, subscription, features } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <button 
            onClick={() => window.location.href = '/auth/signin'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.email}!
          </h1>
          <p className="text-gray-600 mt-2">
            Simple Dashboard - Working Version
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Status</h3>
            <p className="text-gray-600">
              Plan: {subscription?.status === 'active' ? 'Pro' : 'Free'}
            </p>
            <p className="text-gray-600">
              User ID: {user.id.slice(0, 8)}...
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>View JSON: {features.canViewJSON ? '✅' : '❌'}</li>
              <li>Create Prompts: {features.canCreate ? '✅' : '❌'}</li>
              <li>Favorites: {features.canFavorite ? '✅' : '❌'}</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="block w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded"
              >
                Try Full Dashboard
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard/debug'}
                className="block w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded"
              >
                Debug Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a 
                href="/dashboard/create" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Create Prompt</h3>
                <p className="text-sm text-gray-600 mt-1">Create new video prompts</p>
              </a>
              
              <a 
                href="/dashboard/my-prompts" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">My Prompts</h3>
                <p className="text-sm text-gray-600 mt-1">View your created prompts</p>
              </a>
              
              <a 
                href="/dashboard/favorites" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Favorites</h3>
                <p className="text-sm text-gray-600 mt-1">Your favorited prompts</p>
              </a>
              
              <a 
                href="/dashboard/account" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Account</h3>
                <p className="text-sm text-gray-600 mt-1">Account settings</p>
              </a>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Dashboard Status</h3>
          <p className="text-sm text-blue-700">
            This is a simplified dashboard that loads quickly. If you're seeing this page, it means authentication is working correctly. 
            You can try the debug dashboard to identify any remaining issues with the main dashboard.
          </p>
        </div>
      </div>
    </div>
  )
} 