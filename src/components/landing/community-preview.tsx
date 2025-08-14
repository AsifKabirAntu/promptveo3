'use client'

import { useState, useEffect } from 'react'
import { Play, Heart, Eye, User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface CommunityPrompt {
  id: string
  title: string
  description: string
  clean_description?: string
  prompt_category: string
  creator_name: string
  video_thumbnail_url?: string
  views_count: number
  likes_count: number
  is_featured: boolean
}

export function CommunityPreview() {
  const [prompts, setPrompts] = useState<CommunityPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadFeaturedPrompts()
  }, [])

  const loadFeaturedPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_prompts')
        .select(`
          id,
          title,
          description,
          clean_description,
          prompt_category,
          creator_name,
          video_thumbnail_url,
          views_count,
          likes_count,
          is_featured
        `)
        .eq('is_public', true)
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('views_count', { ascending: false })
        .limit(6)

      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error('Error loading featured prompts:', error)
      setPrompts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 mb-4 gap-2">
            <Logo size={20} className="sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">Community Prompts</span>
            <span className="sm:hidden">Community</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Discover what the community is creating
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            Explore high‑quality video prompts created by our community. Find inspiration for your next AI video project.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prompts Grid */}
        {!loading && prompts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {prompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/community/${prompt.id}`}
                className="group"
              >
                <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-gray-200">
                  {/* Video Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
                    {prompt.video_thumbnail_url ? (
                      <img
                        src={prompt.video_thumbnail_url}
                        alt={prompt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Play className="w-12 h-12 text-blue-400" />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-blue-100 text-blue-800 border-0">
                        {prompt.prompt_category}
                      </Badge>
                    </div>

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3">
                        <Play className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {prompt.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {prompt.clean_description || prompt.description}
                    </p>

                    {/* Creator & Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{prompt.creator_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{prompt.views_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>{prompt.likes_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <div className="text-center">
          <Link href="/community">
            <Button size="lg" className="px-8">
              Explore community prompts
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
} 