'use client'

import { useState } from 'react'
import { Sparkles, ArrowRight, Video, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

/**
 * Compact inline ad for FluxFrame with demo video
 */
export function FluxFrameInlineAd() {
  return (
    <div className="my-6 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="grid grid-cols-1 md:grid-cols-[600px,1fr] gap-0">
        {/* Left side - Video Demo */}
        <div className="relative bg-black aspect-[9/16] md:aspect-auto md:h-full min-h-[500px]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="/video/fluxframe-demo.mp4" type="video/mp4" />
          </video>
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
            ✨ NEW
          </div>
        </div>

        {/* Right side - Content */}
        <div className="p-6 flex flex-col justify-center bg-gradient-to-br from-blue-50 to-white">
          <div className="inline-flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded-full mb-4 w-fit">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">One Click Product Photos to Video</span>
          </div>
          
          <h3 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900">
            FluxFrame
          </h3>
          
          <p className="text-gray-600 text-base sm:text-lg mb-6 leading-relaxed">
            Transform product images into stunning 9:16 videos with AI. Perfect for social media, ads, and e-commerce.
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <Video className="w-3 h-3 text-blue-600" />
              </div>
              <span>HD Quality</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-blue-600" />
              </div>
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-blue-600" />
              </div>
              <span>Ready in Seconds</span>
            </div>
          </div>

          <Link href="https://fluxframe.app/" target="_blank" rel="noopener noreferrer">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold group w-full sm:w-auto shadow-md"
            >
              Try FluxFrame
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * Minimal banner ad for FluxFrame - very compact
 */
export function FluxFrameBannerAd() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Video className="w-4 h-4" />
          <span className="hidden sm:inline">
            <strong>FluxFrame:</strong> Transform images into stunning videos with AI
          </span>
          <span className="sm:hidden">
            <strong>FluxFrame</strong> - AI Video Generation
          </span>
        </div>
        <Link href="https://fluxframe.vercel.app" target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary" className="text-xs font-bold">
            Try Free
          </Button>
        </Link>
      </div>
    </div>
  )
}

/**
 * Card-style ad for FluxFrame - compact version for sidebars
 */
export function FluxFrameCardAd() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Video Preview */}
      <div className="relative aspect-[9/16] bg-black overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/video/fluxframe-demo.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg">
          ✨ NEW
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">
              FluxFrame
            </h4>
            <p className="text-xs text-gray-600">
              AI Video Generator
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-3">
          Turn images into stunning 9:16 videos with AI
        </p>

        <Link href="https://fluxframe.vercel.app" target="_blank" rel="noopener noreferrer">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8 shadow-sm">
            Try Free <ArrowRight className="ml-1 w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

