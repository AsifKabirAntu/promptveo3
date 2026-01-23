'use client'

import { Megaphone } from 'lucide-react'
import Link from 'next/link'

export function PriceAnnouncementBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-center flex-wrap">
          <Megaphone className="w-5 h-5 text-yellow-300" />
          <p className="text-sm sm:text-base font-medium">
            <span className="font-bold">New Price Alert!</span> Get Pro access for just{' '}
            <span className="text-yellow-300 font-bold text-lg">$14.99</span>{' '}
            <span className="line-through text-blue-300">$49</span> - Limited time offer! 
            <Link href="/#pricing" className="ml-2 underline hover:text-yellow-300 transition-colors">
              Upgrade now →
            </Link>
          </p>
          <Megaphone className="w-5 h-5 text-yellow-300" />
        </div>
      </div>
    </div>
  )
}
