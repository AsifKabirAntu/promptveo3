'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Copy, Heart, Eye, User, Clock, ChevronRight, Home, 
  Download, Play, Settings, Camera, Lightbulb, 
  MapPin, Zap, Timer, Monitor, Tag 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BlogCTA } from '@/components/blog/blog-cta'
import { RelatedPrompts } from '@/components/community/related-prompts'
import { FluxFrameInlineAd } from '@/components/ads/FluxFrameInlineAd'
import { useAuth } from '@/components/auth/auth-provider'
import { Paywall } from '@/components/ui/paywall'

interface CommunityPromptDetail {
  id: string
  title: string
  description: string
  full_prompt_text: string
  prompt_category: string // Only use the AI-generated category
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

export default function CommunityPromptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, features, subscription } = useAuth()
  const [prompt, setPrompt] = useState<CommunityPromptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const supabase = createClientComponentClient()
  
  // Check if user has Pro access
  const isPro = subscription?.plan === 'pro' || features?.canViewAllPrompts

  useEffect(() => {
    if (params.id) {
      loadPromptDetails(params.id as string)
      // Load liked state from localStorage
      const savedLikes = localStorage.getItem('likedPrompts')
      if (savedLikes) {
        try {
          const likes = JSON.parse(savedLikes)
          setLiked(likes.includes(params.id))
        } catch (error) {
          console.error('Error loading liked state:', error)
        }
      }
    }
  }, [params.id])

  const loadPromptDetails = async (promptId: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('community_prompts')
        .select('*')
        .eq('id', promptId)
        .eq('is_public', true)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('Error loading prompt details:', error)
        return
      }

      if (data) {
        setPrompt(data)
        // Track view after loading prompt details
        trackView(promptId)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const trackView = async (promptId: string) => {
    try {
      const response = await fetch(`/api/community/${promptId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Update the local prompt data with new view count
        setPrompt(prev => prev ? { ...prev, views_count: data.views_count } : null)
      }
    } catch (error) {
      console.error('Error tracking view:', error)
      // Don't show error to user as this is background tracking
    }
  }

  const handleLike = async () => {
    if (!prompt || isLiking) return
    
    try {
      setIsLiking(true)
      const action = liked ? 'unlike' : 'like'
      
      const response = await fetch(`/api/community/${prompt.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update the local prompt data with new like count
        setPrompt(prev => prev ? { ...prev, likes_count: data.likes_count } : null)
        // Toggle liked state
        const newLikedState = !liked
        setLiked(newLikedState)
        
        // Update localStorage
        const savedLikes = localStorage.getItem('likedPrompts')
        let likes = []
        if (savedLikes) {
          try {
            likes = JSON.parse(savedLikes)
          } catch (error) {
            console.error('Error parsing saved likes:', error)
          }
        }
        
        if (newLikedState) {
          likes.push(prompt.id)
        } else {
          likes = likes.filter((id: string) => id !== prompt.id)
        }
        
        localStorage.setItem('likedPrompts', JSON.stringify(likes))
      } else {
        console.error('Error toggling like')
      }
    } catch (error) {
      console.error('Error handling like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const copyPrompt = async () => {
    if (!prompt) return
    
    try {
      // Copy the clean prompt content - prioritize structured JSON
      let textToCopy = ''
      
      // First prioritize structured JSON data for better formatting
      if (prompt.prompt_structure && typeof prompt.prompt_structure === 'object') {
        textToCopy = JSON.stringify(prompt.prompt_structure, null, 2)
      } else if (prompt.veo3_prompt) {
        textToCopy = prompt.veo3_prompt
      } else {
        // Try to parse full_prompt_text as JSON
        try {
          const parsed = JSON.parse(prompt.full_prompt_text)
          if (parsed && typeof parsed === 'object') {
            textToCopy = JSON.stringify(parsed, null, 2)
          } else {
            textToCopy = prompt.full_prompt_text
          }
        } catch {
          // If not JSON, use the raw text
          textToCopy = prompt.full_prompt_text
        }
      }
      
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const downloadPrompt = () => {
    if (!prompt) return
    
    const blob = new Blob([prompt.full_prompt_text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prompt.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-veo3-prompt.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-64 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="aspect-video bg-gray-200 rounded-lg" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 rounded w-4/6" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg" />
                <div className="h-32 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Prompt not found</h2>
          <p className="text-gray-600 mb-4">The prompt you're looking for doesn't exist or has been removed.</p>
          <Link href="/community">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community Directory
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <Link href="/community" className="hover:text-gray-700">Community Directory</Link>
          <span>/</span>
          <Link href={`/community?category=${encodeURIComponent(prompt.prompt_category)}`} className="hover:text-gray-700">
            {prompt.prompt_category}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{prompt.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
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
                    <span>{prompt.views_count} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{prompt.likes_count} likes</span>
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
                    <h3 className="text-xl font-semibold text-gray-900">Veo 3 Prompt</h3>
                    <div className="flex gap-2">
                      <Button onClick={copyPrompt} variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button onClick={downloadPrompt} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
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
                  console.log('Using prompt_structure:', prompt.prompt_structure)
                  cleanPrompt = prompt.prompt_structure
                  isJSON = true
                } else if (prompt.veo3_prompt) {
                  console.log('Using veo3_prompt:', prompt.veo3_prompt ? 'text content' : 'null')
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
                    // If not JSON, use the raw text but clean it up
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

            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Creator</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  {prompt.creator_profile_url ? (
                    <a 
                      href={prompt.creator_profile_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {prompt.creator_name}
                    </a>
                  ) : (
                    <p className="font-medium text-gray-900">{prompt.creator_name}</p>
                  )}
                                     <p className="text-sm text-gray-500">Prompt Creator</p>
                 </div>
               </div>
               
               {/* Creator Stats */}
               <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
                 <div className="flex items-center gap-1">
                   <Eye className="w-4 h-4" />
                   <span>{prompt.views_count.toLocaleString()} views</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <Heart className="w-4 h-4" />
                   <span>{prompt.likes_count.toLocaleString()} likes</span>
                 </div>
               </div>
             </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  {isLiking ? (liked ? 'Unliking...' : 'Liking...') : (liked ? 'Liked' : 'Like This Prompt')}
                </Button>
              </div>
            </Card>

            {/* Prompt Details */}
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
                
                {prompt.environment && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Environment</p>
                      <p className="text-sm text-gray-600">{prompt.environment}</p>
                    </div>
                  </div>
                )}
                
                {prompt.motion && (
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Motion</p>
                      <p className="text-sm text-gray-600">{prompt.motion}</p>
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

            {/* Back Navigation */}
            <Card className="p-6">
              <div className="space-y-3">
                <Link href="/community">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Directory
                  </Button>
                </Link>
                <Link href={`/community?category=${encodeURIComponent(prompt.prompt_category)}`}>
                  <Button variant="ghost" className="w-full">
                    More {prompt.prompt_category} Prompts
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Related Prompts Section */}
        <div className="mt-12">
          <RelatedPrompts category={prompt.prompt_category} currentPromptId={prompt.id} />
        </div>
        
        {/* FluxFrame Ad */}
        <div className="mt-12">
          <FluxFrameInlineAd />
        </div>
        
        {/* CTA Section */}
        <div className="mt-12">
          <BlogCTA 
            primaryText="Explore More Community Prompts"
            primaryHref="/community"
            secondaryText="Join the Community"
            secondaryHref="/auth/signin"
          />
        </div>
      </div>
    </div>
    
    <Footer />
    </>
  )
} 