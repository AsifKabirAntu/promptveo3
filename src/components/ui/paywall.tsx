import { Lock, Sparkles, Zap, Star, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"

interface PaywallProps {
  title?: string
  description?: string
  feature?: string
  showUpgradeButton?: boolean
  className?: string
  onClose?: () => void
  children?: ReactNode
}

export function Paywall({ 
  title = "Upgrade to Pro", 
  description = "Unlock this feature and get unlimited access to all prompts",
  feature,
  showUpgradeButton = true,
  className = "",
  onClose,
  children
}: PaywallProps) {
  const features = [
    "Unlimited prompt access",
    "JSON export for Veo 3",
    "Save favorites",
    "Remix prompts",
    "Create custom prompts",
    "Priority support"
  ]

  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 max-w-3xl mx-auto ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-16 w-16 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20" />
      
      <div className="relative z-10">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {feature && (
                <p className="text-sm text-gray-600">Feature: {feature}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-center text-gray-700 mb-6">{description}</p>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                <Sparkles className="h-3 w-3 text-green-600" />
              </div>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full px-4 py-2">
            <Star className="h-4 w-4 text-white" />
            <span className="text-white font-semibold">Pro Plan</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">$49</span>
            <span className="text-gray-600"> one-time</span>
          </div>
        </div>

        {/* CTA Button */}
        {showUpgradeButton && (
          <div className="text-center max-w-xs mx-auto">
            <Link href="/dashboard/billing">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        )}
        
        {/* Custom Content */}
        {children && (
          <div className="mt-4 text-center">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// Compact paywall for smaller spaces
export function CompactPaywall({ 
  title = "Pro Feature", 
  description = "Upgrade to unlock this feature",
  showUpgradeButton = true,
  feature,
  onClose,
  children
}: PaywallProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-bl-full" />
      
      <div className="relative z-10">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Content */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <Lock className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
            
            {/* Feature */}
            {feature && (
              <div className="mt-2 flex items-center">
                <Sparkles className="h-3 w-3 text-blue-500 mr-1" />
                <span className="text-xs text-gray-700">{feature}</span>
              </div>
            )}
            
            {/* CTA Button */}
            {showUpgradeButton && (
              <div className="mt-3">
                <Link href="/dashboard/billing">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm py-1 h-auto">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            )}
            
            {/* Custom Content */}
            {children && (
              <div className="mt-3">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 