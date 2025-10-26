'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Copy, Heart, Eye, User, Clock, ChevronRight, 
  Download, Play, Settings, Camera, Lightbulb, 
  MapPin, Zap, Timer, Monitor, Tag, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/components/auth/auth-provider'
import { FluxFrameInlineAd } from '@/components/ads/FluxFrameInlineAd'

interface CommunityPromptDetail {
  id: string
  title: string
  description: string
  full_prompt_text: string
  prompt_category: string
  tags: string[]
  difficulty_level?: string
  creator_name: string
  creator_profile_url?: string
  prompt_structure?: any
  veo3_prompt?: string
  clean_description?: string
  extracted_tags?: string[]
  style?: string
  camera_settings?: string
  lighting?: string
  environment?: string
  motion?: string
  duration_seconds?: number
  aspect_ratio?: string
  video_url?: string
  local_video_path?: string
  video_thumbnail_url?: string
  video_metadata?: any
  views_count: number
  likes_count: number
  comments_count: number
  created_at: string
  is_featured: boolean
}

export default function DashboardCommunityPromptDetail() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [prompt, setPrompt] = useState<CommunityPromptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [viewsCount, setViewsCount] = useState(0)

  useEffect(() => {
    if (params.id) {
      loadPrompt()
    }
  }, [params.id])

  const loadPrompt = async () => {
    try {
      setLoading(true)
      const supabase = createClientComponentClient()
      
      const { data, error } = await supabase
        .from('community_prompts')
        .select('*')
        .eq('id', params.id)
        .eq('is_public', true)
        .eq('status', 'active')
        .single()

      if (error) throw error

      setPrompt(data)
      setLikesCount(data.likes_count || 0)
      setViewsCount(data.views_count || 0)
      
      // Track view
      await trackView()
      
    } catch (error: any) {
      console.error('Error loading prompt:', error)
      setError('Failed to load prompt')
    } finally {
      setLoading(false)
    }
  }

  const trackView = async () => {
    try {
      const supabase = createClientComponentClient()
      await supabase.rpc('increment_community_views', { 
        prompt_id: params.id 
      })
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const handleCopy = () => {
    if (prompt?.veo3_prompt || prompt?.full_prompt_text) {
      navigator.clipboard.writeText(prompt.veo3_prompt || prompt.full_prompt_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLike = async () => {
    if (!user) return
    
    try {
      const action = isLiked ? 'unlike' : 'like'
      
      const response = await fetch(`/api/community/${params.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const data = await response.json()
        setLikesCount(data.likes_count)
        setIsLiked(!isLiked)
      }
    } catch (error) {
      console.error('Error handling like:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error || !prompt) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Prompt not found'}
          </h3>
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back Button */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          {(prompt.local_video_path || prompt.video_url || prompt.video_thumbnail_url) && (
            <Card className="overflow-hidden">
              <div className="aspect-video bg-black">
                <video
                  controls
                  className="w-full h-full"
                  poster={prompt.video_thumbnail_url}
                  preload="metadata"
                >
                  {prompt.local_video_path && (
                    <source src={`/api/videos/${prompt.local_video_path.split('/').pop()}`} type="video/mp4" />
                  )}
                  {!prompt.local_video_path && (prompt.video_url || prompt.video_thumbnail_url) && (
                    <source src={prompt.video_url || prompt.video_thumbnail_url} type="video/mp4" />
                  )}
                  <p className="text-white p-4">
                    Your browser doesn't support video playback. 
                    <a href={prompt.local_video_path ? `/api/videos/${prompt.local_video_path.split('/').pop()}` : (prompt.video_url || prompt.video_thumbnail_url)} className="text-blue-400 underline ml-1">
                      Download the video
                    </a>
                  </p>
                </video>
              </div>
            </Card>
          )}

          {/* Title and Description */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {prompt.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{prompt.creator_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(prompt.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{viewsCount} views</span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLike}
                  className={isLiked ? "text-red-500 border-red-200" : ""}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  {likesCount}
                </Button>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              {prompt.clean_description || prompt.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge className="bg-blue-100 text-blue-800">
                {prompt.prompt_category}
              </Badge>
              {(prompt.extracted_tags || prompt.tags).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {prompt.difficulty_level && (
                <Badge variant="outline">
                  {prompt.difficulty_level}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Prompt Text */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Prompt Text</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            
            <Textarea
              value={prompt.veo3_prompt || prompt.full_prompt_text}
              readOnly
              className="min-h-[200px] resize-none bg-gray-50"
            />
            
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>Free to use</span>
                <span>{(prompt.veo3_prompt || prompt.full_prompt_text).length} characters</span>
              </div>
            </div>
          </Card>

          {/* Technical Details */}
          {(prompt.style || prompt.camera_settings || prompt.lighting) && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Technical Details</h3>
              <div className="space-y-3 text-sm">
                {prompt.style && (
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Style:</span>
                    <span className="font-medium">{prompt.style}</span>
                  </div>
                )}
                {prompt.camera_settings && (
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Camera:</span>
                    <span className="font-medium">{prompt.camera_settings}</span>
                  </div>
                )}
                {prompt.lighting && (
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Lighting:</span>
                    <span className="font-medium">{prompt.lighting}</span>
                  </div>
                )}
                {prompt.duration_seconds && (
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{prompt.duration_seconds}s</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* FluxFrame Ad - Before end of page */}
      <div className="mt-12">
        <FluxFrameInlineAd />
      </div>
    </div>
  )
} 