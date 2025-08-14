'use client'

import { useState, useEffect } from 'react'
import { Play, Heart, Eye, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
}

interface RelatedPromptsProps {
  category: string
  currentPromptId: string
}

export function RelatedPrompts({ category, currentPromptId }: RelatedPromptsProps) {
  const [prompts, setPrompts] = useState<CommunityPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadRelatedPrompts()
  }, [category, currentPromptId])

  const loadRelatedPrompts = async () => {
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
          likes_count
        `)
        .eq('is_public', true)
        .eq('status', 'active')
        .eq('prompt_category', category)
        .neq('id', currentPromptId)
        .order('views_count', { ascending: false })
        .limit(6)

      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error('Error loading related prompts:', error)
      setPrompts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              More {category} Prompts
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (prompts.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            More {category} Prompts
          </h2>
          <p className="text-gray-600">
            Explore other prompts in the {category} category
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        <div className="text-center mt-12">
          <Link
            href={`/community?category=${encodeURIComponent(category)}`}
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            View all {category} prompts →
          </Link>
        </div>
      </div>
    </section>
  )
} 