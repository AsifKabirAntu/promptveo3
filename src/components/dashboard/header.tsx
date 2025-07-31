'use client'

import { User, LogOut, Settings, Sparkles, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
  }

  // Get current page title
  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Explore Library'
      case '/dashboard/favorites':
        return 'My Favorites'
      case '/dashboard/my-prompts':
        return 'My Prompts'
      case '/dashboard/create':
        return 'Create Prompt'
      case '/dashboard/account':
        return 'Account Settings'
      default:
        if (pathname?.includes('/prompts/')) return 'Prompt Details'
        if (pathname?.includes('/timeline-prompts/')) return 'Timeline Prompt Details'
        return 'Dashboard'
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 lg:pl-64">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Page Title & Beta Badge */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Beta
            </Badge>
          </div>

          {/* Right side - Actions & Profile */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              <Link href="/dashboard/create">
                <Button variant="outline" size="sm" className="gap-2">
                  Create Prompt
                </Button>
              </Link>
            </div>
            
            {/* User Profile */}
            <div className="relative">
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col text-right text-sm">
                  <span className="font-medium text-gray-900">
                    {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Beta User'}
                  </span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full bg-gray-100 hover:bg-gray-200"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User className="h-5 w-5" />
                </Button>
              </div>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.user_metadata?.name || 'Beta User'}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <Link href="/dashboard/favorites">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-4 py-2 text-gray-700"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        My Favorites
                      </Button>
                    </Link>
                    
                    <Link href="/dashboard/account">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-4 py-2 text-gray-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>

                    <div className="border-t border-gray-100 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 