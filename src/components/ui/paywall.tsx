import { Lock, Sparkles, Zap, Star, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface PaywallProps {
  title?: string
  description?: string
  feature?: string
  showUpgradeButton?: boolean
  className?: string
  onClose?: () => void
}

export function Paywall({ 
  title = "Upgrade to Pro", 
  description = "Unlock this feature and get unlimited access to all prompts",
  feature,
  showUpgradeButton = true,
  className = "",
  onClose
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
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 ${className}`}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
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
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900">$14.99</span>
            <span className="text-gray-600">/month</span>
          </div>
          <div className="text-sm text-gray-500">or $120/year (save 33%)</div>
        </div>

        {/* CTA Button */}
        {showUpgradeButton && (
          <div className="text-center">
            <Link href="/dashboard/billing">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </Link>
            <p className="text-xs text-gray-500 mt-2">
              Cancel anytime
            </p>
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
  onClose
}: PaywallProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30" />
      
      <div className="relative z-10 flex items-center justify-between">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-1 right-1 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Lock className="h-4 w-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        
        {showUpgradeButton && (
          <Link href="/dashboard/billing">
            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Upgrade
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
} 