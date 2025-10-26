'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, ArrowRight, Zap, Video, Image as ImageIcon, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FluxFrameAdProps {
  variant?: 'banner' | 'sidebar' | 'inline' | 'modal' | 'floating'
  dismissible?: boolean
  showAnimation?: boolean
}

export function FluxFrameAd({ 
  variant = 'inline', 
  dismissible = true,
  showAnimation = true 
}: FluxFrameAdProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the ad (stored in localStorage)
    const dismissed = localStorage.getItem('fluxframe-ad-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      
      // Show ad again after 3 days
      if (daysSinceDismissed < 3) {
        setIsDismissed(true)
        return
      }
    }
    
    // Delay showing the ad for better UX
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('fluxframe-ad-dismissed', Date.now().toString())
  }

  if (isDismissed) return null

  // Banner variant - top of page
  if (variant === 'banner') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white py-3 px-4"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <p className="text-sm sm:text-base font-medium">
                  <span className="font-bold">New:</span> Transform product images into stunning videos with FluxFrame AI
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="https://fluxframe.vercel.app" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary" className="whitespace-nowrap">
                    Try Free <ArrowRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
                {dismissible && (
                  <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Sidebar variant - compact vertical ad
  if (variant === 'sidebar') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 overflow-hidden"
          >
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 hover:bg-white/50 dark:hover:bg-black/50 rounded-full transition-colors z-10"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl animate-pulse delay-700" />
            </div>

            <div className="relative">
              {/* Logo/Badge */}
              <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full mb-4">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">FluxFrame</span>
              </div>

              {/* Headline */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Turn Images into Videos
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                AI-powered video generation from product images. Perfect for social media & ads.
              </p>

              {/* Features */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Video className="w-3 h-3 text-blue-600" />
                  <span>9:16 vertical videos</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Wand2 className="w-3 h-3 text-purple-600" />
                  <span>AI-powered generation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Ready in seconds</span>
                </div>
              </div>

              {/* CTA */}
              <Link href="https://fluxframe.vercel.app" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Try FluxFrame Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Floating variant - bottom right corner
  if (variant === 'floating') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden">
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}

              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 animate-pulse" />

              <div className="relative">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Love AI Videos?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Try <span className="font-bold text-blue-600">FluxFrame</span> - Transform your product images into stunning videos with AI in seconds!
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span>Fast</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span>AI-Powered</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Video className="w-3 h-3 text-purple-500" />
                    <span>HD Quality</span>
                  </div>
                </div>

                {/* CTA */}
                <Link href="https://fluxframe.vercel.app" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group">
                    Try FluxFrame Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Modal variant - center overlay
  if (variant === 'modal') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Content */}
              <div className="p-8 sm:p-12">
                <div className="text-center">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6">
                    <Video className="w-8 h-8 text-white" />
                  </div>

                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full mb-4">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      New AI Tool
                    </span>
                  </div>

                  {/* Headline */}
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Meet FluxFrame
                  </h2>

                  {/* Subheadline */}
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
                    Transform your product images into stunning 9:16 videos with AI. Perfect for social media, ads, and e-commerce.
                  </p>

                  {/* Features grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <ImageIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Upload Image</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Any product photo</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <Wand2 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">AI Magic</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Instant analysis</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <Video className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Get Video</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ready in seconds</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="https://fluxframe.vercel.app" target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 group">
                        Try FluxFrame Free
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Button size="lg" variant="outline" onClick={handleDismiss} className="text-lg px-8">
                      Maybe Later
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Inline variant - default, full-width card
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="relative bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 overflow-hidden shadow-lg"
        >
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 hover:bg-white/50 dark:hover:bg-black/50 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-700">Introducing FluxFrame</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Transform Images into{' '}
                <span className="text-blue-600">
                  Stunning Videos
                </span>
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-600 mb-6">
                Upload product images and let AI create professional 9:16 videos in seconds. Perfect for social media, ads, and e-commerce.
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Fast Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Video className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">HD Quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">AI-Powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Easy to Use</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="https://fluxframe.vercel.app" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 group shadow-md">
                    Try FluxFrame Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="https://fluxframe.vercel.app" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side - Visual */}
            <div className="relative">
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800">
                {/* Mock UI */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                  
                  <div className="aspect-[9/16] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                    <Video className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg" />
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              {showAnimation && (
                <>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-4 -right-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-800"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-800"
                  >
                    <Zap className="w-5 h-5 text-blue-500" />
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

