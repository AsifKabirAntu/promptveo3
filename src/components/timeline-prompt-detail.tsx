"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Heart, Copy, Edit, Download, Clock, Eye, Tag, Calendar, Play, Wand2, Lock } from "lucide-react"
import { TimelinePrompt } from "@/types/timeline-prompt"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Paywall } from "@/components/ui/paywall"
import { useAuth } from "@/components/auth/auth-provider"
import { canViewTimelinePrompt, hasProAccess } from "@/lib/timeline-prompts-client"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface TimelinePromptDetailProps {
  prompt: TimelinePrompt
}

export function TimelinePromptDetail({ prompt }: TimelinePromptDetailProps) {
  const { features } = useAuth()
  const [activeTab, setActiveTab] = useState<"readable" | "json">("readable")
  const [isFavorited, setIsFavorited] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [canViewPrompt, setCanViewPrompt] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallFeature, setPaywallFeature] = useState('')
  
  // Check if user can view this timeline prompt
  useEffect(() => {
    async function checkAccess() {
      try {
        setLoading(true)
        const hasPro = await hasProAccess()
        const canView = hasPro || canViewTimelinePrompt(prompt.id)
        setCanViewPrompt(canView)
      } catch (error) {
        console.error('Error checking prompt access:', error)
        setCanViewPrompt(false) // Default to no access on error
      } finally {
        setLoading(false)
      }
    }
    
    checkAccess()
  }, [prompt.id])
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // If free user can't view this prompt, show paywall
  if (!canViewPrompt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with back button */}
          <div className="mb-8">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
              </Button>
            </Link>
          </div>
          
          {/* Paywall */}
          <div className="py-8">
            <Paywall 
              title="Premium Timeline Prompt Access"
              description="Upgrade to Pro to view all timeline prompts in our library. Free users can view 2 regular prompts and 2 timeline prompts."
              feature="Full timeline prompt access"
              className="max-w-2xl mx-auto"
            />
          </div>
        </div>
      </div>
    )
  }

  const handleFeatureClick = (feature: string, action: () => void) => {
    if (features.canViewJSON && feature === 'json') {
      action()
    } else if (features.canRemix && feature === 'remix') {
      action()
    } else if (features.canViewJSON && feature === 'copy') {
      action()
    } else if (features.canViewJSON && feature === 'export') {
      action()
    } else {
      setPaywallFeature(feature)
      setShowPaywall(true)
    }
  }

  const getPaywallTitle = (feature: string) => {
    switch (feature) {
      case 'json': return 'JSON Export'
      case 'remix': return 'Remix Prompt'
      case 'copy': return 'Copy JSON'
      case 'export': return 'Export JSON'
      default: return 'Premium Feature'
    }
  }

  const handleCopy = () => {
    const jsonData = {
      title: prompt.title,
      description: prompt.description,
      category: prompt.category,
      base_style: prompt.base_style,
      aspect_ratio: prompt.aspect_ratio,
      scene_description: prompt.scene_description,
      camera_setup: prompt.camera_setup,
      lighting: prompt.lighting,
      negative_prompts: prompt.negative_prompts,
      timeline: prompt.timeline
    }
    
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = () => {
    const jsonData = {
      title: prompt.title,
      description: prompt.description,
      category: prompt.category,
      base_style: prompt.base_style,
      aspect_ratio: prompt.aspect_ratio,
      scene_description: prompt.scene_description,
      camera_setup: prompt.camera_setup,
      lighting: prompt.lighting,
      negative_prompts: prompt.negative_prompts,
      timeline: prompt.timeline
    }
    
    const dataStr = JSON.stringify(jsonData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${prompt.title.toLowerCase().replace(/\s+/g, '-')}-timeline.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const jsonPreview = {
    title: prompt.title,
    description: prompt.description,
    category: prompt.category,
    base_style: prompt.base_style,
    aspect_ratio: prompt.aspect_ratio,
    scene_description: prompt.scene_description,
    camera_setup: prompt.camera_setup,
    lighting: prompt.lighting,
    negative_prompts: prompt.negative_prompts,
    timeline: prompt.timeline
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="group hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Library
            </Button>
          </Link>
        </div>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                {prompt.category}
              </Badge>
              <Badge variant="outline" className="bg-gray-50">
                {prompt.base_style}
              </Badge>
              <Badge variant="outline" className="bg-gray-50">
                {prompt.aspect_ratio}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                Timeline Prompt
              </Badge>
              {prompt.created_by === 'ai-generator' && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">
                  ✨ AI Generated
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">{prompt.title}</h1>
            <p className="text-lg text-gray-600">{prompt.description}</p>

            <div className="flex items-center gap-6 text-sm text-gray-500 mt-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{prompt.created_by === 'ai-generator' ? 'Generated' : `Created ${formatDate(new Date(prompt.created_at))}`}</span>
              </div>
              {prompt.created_by !== 'ai-generator' && (
                <>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span>{prompt.likes_count} likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{prompt.usage_count} uses</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => handleFeatureClick('copy', handleCopy)}
                className={`gap-2 transition-all ${
                  copied 
                    ? "bg-green-50 text-green-600 border-green-200" 
                    : "hover:bg-gray-100"
                }`}
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy JSON"}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFeatureClick('export', handleExport)}
                className="gap-2 hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>

              <Button
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleFeatureClick('remix', () => {
                  window.location.href = `/dashboard/editor?remix-timeline=${prompt.id}`
                })}
              >
                <Edit className="w-4 h-4" />
                Remix Prompt
              </Button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('readable')}
                className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                  activeTab === 'readable'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Human Readable
              </button>
              {features.canViewJSON ? (
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === 'json'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Raw JSON
                </button>
              ) : (
                <button
                  disabled
                  className="px-6 py-4 text-sm font-medium text-gray-400 cursor-not-allowed flex items-center gap-2"
                >
                  Raw JSON
                  {/* Removed Lock icon as it's not imported */}
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'readable' ? (
              <div className="space-y-6">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                        <path d="M13 2v7h7" />
                      </svg>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Scene Description</h3>
                      <p className="text-gray-900">{prompt.scene_description}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Base Style</h3>
                      <p className="text-gray-900">{prompt.base_style}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Technical Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Camera Setup</h3>
                      <p className="text-gray-900">{prompt.camera_setup}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Lighting</h3>
                      <p className="text-gray-900">{prompt.lighting}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Aspect Ratio</h3>
                      <p className="text-gray-900">{prompt.aspect_ratio}</p>
                    </div>
                  </CardContent>
                </Card>

                {prompt.negative_prompts && prompt.negative_prompts.length > 0 && (
                  <Card className="border-0 shadow-none bg-gray-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM8 13h8M16 8l-4 8-4-8" />
                        </svg>
                        Negative Prompts
                      </CardTitle>
                      <CardDescription>Elements to avoid in the generation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {prompt.negative_prompts.map((negative, index) => (
                          <Badge key={index} variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                            {negative}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Timeline Sequence
                    </CardTitle>
                    <CardDescription>Step-by-step breakdown of the video timeline</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {prompt.timeline.map((step, index) => (
                        <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Sequence {step.sequence}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100">
                              {step.timestamp}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Action</h4>
                              <p className="text-gray-900">{step.action}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Dialogue</h4>
                              <p className="text-gray-900">{step.dialogue}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : features.canViewJSON ? (
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Raw JSON</CardTitle>
                  <CardDescription>
                    Copy this JSON to use with Veo 3 or other AI video generation tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="absolute right-2 top-2"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <pre className="bg-white rounded-lg p-4 overflow-x-auto text-sm">
                      <code className="text-gray-900">{JSON.stringify(jsonPreview, null, 2)}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="py-8">
                <Paywall
                  title="JSON Export"
                  description="Upgrade to Pro to view and export timeline prompts in JSON format for Veo 3."
                  feature="JSON export"
                  className="max-w-2xl mx-auto"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
            <Paywall
              title={getPaywallTitle(paywallFeature)}
              description={`Upgrade to Pro to ${paywallFeature} timeline prompts and unlock all premium features.`}
              feature={paywallFeature}
              showUpgradeButton={true}
              onClose={() => setShowPaywall(false)}
            />
          </div>
        </div>
      )}
    </>
  )
} 