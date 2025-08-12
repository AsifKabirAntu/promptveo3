"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { smoothScrollWithBounce } from "@/lib/smooth-scroll"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleNavClick = (sectionId: string) => {
    smoothScrollWithBounce(sectionId)
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Logo size={32} />
              <span className="text-xl font-bold text-gray-900">PromptVeo3</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => handleNavClick('how-it-works')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-105 transform hover:translate-y-[-1px]"
            >
              How it Works
            </button>
            <button 
              onClick={() => handleNavClick('prompt-preview')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-105 transform hover:translate-y-[-1px]"
            >
              Example
            </button>
            <button 
              onClick={() => handleNavClick('video-showcase')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-105 transform hover:translate-y-[-1px]"
            >
              Veo3 Output
            </button>
            <Link
              href="/insights"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-105 transform hover:translate-y-[-1px]"
            >
              Insights
            </Link>
            <button 
              onClick={() => handleNavClick('pricing')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-105 transform hover:translate-y-[-1px]"
            >
              Pricing
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">
                Join Beta
              </Button>
            </Link>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="px-2 pt-2 pb-3 space-y-1">
              <button 
                onClick={() => handleNavClick('how-it-works')}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-all duration-200 hover:translate-x-1"
              >
                How it Works
              </button>
              <button 
                onClick={() => handleNavClick('prompt-preview')}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-all duration-200 hover:translate-x-1"
              >
                Example
              </button>
              <button 
                onClick={() => handleNavClick('video-showcase')}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-all duration-200 hover:translate-x-1"
              >
                Veo3 Output
              </button>
              <Link
                href="/insights"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-all duration-200 hover:translate-x-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Insights
              </Link>
              <button 
                onClick={() => handleNavClick('pricing')}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-all duration-200 hover:translate-x-1"
              >
                Pricing
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
} 