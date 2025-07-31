"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  Compass, 
  Heart, 
  FolderOpen, 
  Plus, 
  Settings
} from "lucide-react"
import { Logo } from "@/components/ui/logo"

const navigation = [
  { name: "Explore Library", href: "/dashboard", icon: Compass },
  { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
  { name: "My Prompts", href: "/dashboard/my-prompts", icon: FolderOpen },
  { name: "Create Prompt", href: "/dashboard/create", icon: Plus },
  { name: "Account", href: "/dashboard/account", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
        <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center space-x-2">
                          <Logo size={32} />
            <span className="text-xl font-bold text-gray-900">PromptVeo3</span>
          </Link>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 flex-1 space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
} 