'use client'

import { SignInForm } from "@/components/auth/signin-form"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"

export default function SignInPage() {
  useEffect(() => {
    // Clear any stale auth data when visiting sign-in page
    const supabase = createClient()
    
    // Check if there's a session and clear it if it's invalid
    const clearStaleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // If session exists but user data is missing, clear it
        if (!session.user || !session.user.email) {
          console.log('Clearing stale session data')
          await supabase.auth.signOut()
        }
      }
    }
    
    clearStaleAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex min-h-screen">
        {/* Left side - Sign In Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <a href="/" className="flex items-center justify-center space-x-2 mb-6">
                <div className="flex items-center justify-center ">
                  <img
                    src="/favicon-32x32.png"
                    alt="PromptVeo3"
                    className="w-auto h-auto"
                    width={40}
                    height={40}
                  />
                </div>
                <span className="text-2xl font-bold text-gray-900">PromptVeo3</span>
              </a>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-600">Continue creating amazing videos with structured prompts</p>
            </div>
            
            <SignInForm />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Preview */}
        <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Creative Dashboard</h2>
              <p className="text-gray-600">Access your saved prompts and create new ones</p>
            </div>
            
            {/* Sample Prompt Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Your Prompt</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Saved</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Urban Sunset Chase</h3>
              <p className="text-gray-600 text-sm mb-4">A dynamic chase scene through city streets during golden hour.</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <span className="text-xs text-gray-500">Camera</span>
                  <p className="text-sm font-medium">Tracking shot</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Lighting</span>
                  <p className="text-sm font-medium">Golden hour</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Motion</span>
                  <p className="text-sm font-medium">Fast tracking</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Style</span>
                  <p className="text-sm font-medium">Action</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">action</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">chase</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">urban</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">sunset</span>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Edit →</button>
              </div>
            </div>
            
            {/* JSON Structure Preview */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">JSON Structure</span>
                <span className="text-xs text-gray-500">Ready to Export</span>
              </div>
              <pre className="text-xs text-gray-300 overflow-x-auto">
{`{
  "title": "Urban Sunset Chase",
  "camera": "Tracking shot",
  "lighting": "Golden hour",
  "motion": "Fast tracking",
  "keywords": ["action", "chase", "urban"],
  "style": "Action"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-gray-500">
          Need help? Contact us at{' '}
          <a href="mailto:info@promptveo3.com" className="text-blue-600 hover:text-blue-500">
            info@promptveo3.com
          </a>
        </p>
      </div>
    </div>
  )
} 