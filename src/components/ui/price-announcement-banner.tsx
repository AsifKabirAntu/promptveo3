'use client'

import { X, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export function PriceAnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if banner was dismissed
    const dismissed = localStorage.getItem('price-banner-dismissed')
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('price-banner-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-center flex-wrap">
          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          <p className="text-sm sm:text-base font-medium">
            <span className="font-bold">New Price Alert!</span> Get Pro access for just{' '}
            <span className="text-yellow-300 font-bold text-lg">$14.99</span>{' '}
            <span className="line-through text-blue-300">$49</span> - Limited time offer! 
            <Link href="/#pricing" className="ml-2 underline hover:text-yellow-300 transition-colors">
              Upgrade now →
            </Link>
          </p>
          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
        </div>
      </div>
      
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-blue-900 rounded-full transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
