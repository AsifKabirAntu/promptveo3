'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Copy, Heart, Eye, User, Clock, ChevronRight, 
  Download, Settings, Camera, Lightbulb, 
  MapPin, Zap, Timer, Monitor, Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/components/auth/auth-provider'
import { FluxFrameInlineAd } from '@/components/ads/FluxFrameInlineAd'
import { Paywall } from '@/components/ui/paywall'
import { RelatedCommunityPrompts } from '@/components/dashboard/related-community-prompts'

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
  const { user, features, subscription } = useAuth()
  const [prompt, setPrompt] = useState<CommunityPromptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [viewsCount, setViewsCount] = useState(0)
  
  // Check if user has Pro access
  const isPro = subscription?.plan === 'pro' || features?.canViewAllPrompts

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
        {/* Main Content - LEFT SIDE (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-100 text-blue-800 border-0">
                {prompt.prompt_category}
              </Badge>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{prompt.title}</h1>
            
            <p className="text-lg text-gray-600 mb-6">{prompt.clean_description || prompt.description}</p>
            
            {/* Tags */}
            {(() => {
              const displayTags = prompt.extracted_tags && prompt.extracted_tags.length > 0 
                ? prompt.extracted_tags 
                : []
              return displayTags.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {displayTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })()}
            
            {/* Creator & Stats */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{prompt.creator_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(prompt.created_at)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{viewsCount} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{likesCount} likes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Preview */}
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

          {/* Prompt Content */}
          <Card className="p-6">
            {isPro ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Veo 3 Prompt</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="flex items-center gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([prompt.veo3_prompt || prompt.full_prompt_text], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${prompt.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-veo3-prompt.txt`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
                
                {/* Display clean Veo 3 prompt using parsed content */}
                {(() => {
                  // Priority: prompt_structure (JSON) > veo3_prompt (text) > full_prompt_text 
                  let cleanPrompt = null
                  let isJSON = false

                  // First prioritize structured JSON data for better formatting
                  if (prompt.prompt_structure && typeof prompt.prompt_structure === 'object') {
                    cleanPrompt = prompt.prompt_structure
                    isJSON = true
                  } else if (prompt.veo3_prompt) {
                    cleanPrompt = prompt.veo3_prompt
                    isJSON = false
                  } else {
                    // Try to parse full_prompt_text as JSON
                    try {
                      const parsed = JSON.parse(prompt.full_prompt_text)
                      if (parsed && typeof parsed === 'object') {
                        cleanPrompt = parsed
                        isJSON = true
                      } else {
                        cleanPrompt = prompt.full_prompt_text
                      }
                    } catch {
                      // If not JSON, use the raw text
                      cleanPrompt = prompt.full_prompt_text
                    }
                  }

                  if (isJSON && cleanPrompt) {
                    // If it's JSON, render it in a structured, readable format
                    const renderJSONContent = (obj: any) => {
                      if (typeof obj === 'string') {
                        return (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{obj}</p>
                          </div>
                        )
                      }
                      
                      return (
                        <div className="space-y-4">
                          {Object.entries(obj).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                  {key.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="text-gray-800 leading-relaxed">
                                {typeof value === 'object' ? (
                                  <pre className="text-sm font-mono whitespace-pre-wrap">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : (
                                  <p className="whitespace-pre-wrap">{String(value)}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <p className="text-sm text-blue-800 font-medium">
                            📋 Structured Veo 3 Prompt
                          </p>
                        </div>
                        {renderJSONContent(cleanPrompt)}
                        
                        {/* Collapsible raw JSON for technical users */}
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
                            <span>Show Raw JSON</span>
                          </summary>
                          <div className="mt-3 bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                            <pre className="text-xs font-mono leading-relaxed">
                              {JSON.stringify(cleanPrompt, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )
                  } else {
                    return (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <p className="text-sm text-green-800 font-medium">
                            📝 Veo 3 Prompt
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Copy this prompt and paste it into your Veo 3 interface
                          </p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <p className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap">
                            {cleanPrompt || 'No prompt content available'}
                          </p>
                        </div>
                      </div>
                    )
                  }
                })()}
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>How to use:</strong> Copy this prompt and paste it into your Veo 3 interface. 
                    Adjust parameters as needed for your specific requirements.
                  </p>
                </div>
              </>
            ) : (
              <Paywall 
                title="Unlock Community Prompts"
                description="Upgrade to Pro to access full Veo3 prompts from our community library. Get unlimited access to all prompts and features."
                feature="view community prompts"
                showUpgradeButton={true}
              />
            )}
          </Card>
        </div>

        {/* Sidebar - RIGHT SIDE (1 column) */}
        <div className="space-y-6">
          {/* Creator Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Creator</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{prompt.creator_name}</p>
                <p className="text-sm text-gray-500">Prompt Creator</p>
              </div>
            </div>
            
            {/* Creator Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{viewsCount.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{likesCount.toLocaleString()} likes</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {isPro ? (
                <>
                  <Button 
                    onClick={handleCopy}
                    className="w-full"
                    variant="default"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy Prompt'}
                  </Button>
                  <Button 
                    onClick={() => {
                      const blob = new Blob([prompt.veo3_prompt || prompt.full_prompt_text], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${prompt.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-veo3-prompt.txt`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </>
              ) : null}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLike}
              >
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {isLiked ? 'Liked' : 'Like This Prompt'}
              </Button>
            </div>
          </Card>

          {/* Prompt Details */}
          {(prompt.style || prompt.camera_settings || prompt.lighting || prompt.duration_seconds || prompt.aspect_ratio) && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Prompt Details</h3>
              <div className="space-y-4">
                {prompt.style && (
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Style</p>
                      <p className="text-sm text-gray-600">{prompt.style}</p>
                    </div>
                  </div>
                )}
                
                {prompt.camera_settings && (
                  <div className="flex items-center gap-3">
                    <Camera className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Camera</p>
                      <p className="text-sm text-gray-600">{prompt.camera_settings}</p>
                    </div>
                  </div>
                )}
                
                {prompt.lighting && (
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Lighting</p>
                      <p className="text-sm text-gray-600">{prompt.lighting}</p>
                    </div>
                  </div>
                )}
                
                {prompt.duration_seconds && (
                  <div className="flex items-center gap-3">
                    <Timer className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Duration</p>
                      <p className="text-sm text-gray-600">{prompt.duration_seconds} seconds</p>
                    </div>
                  </div>
                )}
                
                {prompt.aspect_ratio && (
                  <div className="flex items-center gap-3">
                    <Monitor className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Aspect Ratio</p>
                      <p className="text-sm text-gray-600">{prompt.aspect_ratio}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* Related Prompts */}
      <RelatedCommunityPrompts 
        category={prompt.prompt_category} 
        currentPromptId={prompt.id} 
      />
      
      {/* FluxFrame Ad - Before end of page */}
      <div className="mt-12">
        <FluxFrameInlineAd />
      </div>
    </div>
  )
} 