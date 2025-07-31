"use client"

import { useState, useEffect } from "react"
import { X, Heart, Copy, Edit, Download, Clock, Eye, Tag } from "lucide-react"
import { Prompt } from "@/types/prompt"
import { TimelinePrompt } from "@/types/timeline-prompt"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

type UnifiedPrompt = (Prompt & { type: 'regular' }) | (TimelinePrompt & { type: 'timeline' })

interface PromptSideSheetProps {
  prompt: UnifiedPrompt | null
  isOpen: boolean
  onClose: () => void
}

export function PromptSideSheet({ prompt, isOpen, onClose }: PromptSideSheetProps) {
  const [activeTab, setActiveTab] = useState<"readable" | "json">("readable")
  const [isFavorited, setIsFavorited] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Reset tab when prompt changes
    if (prompt) {
      setActiveTab("readable")
    }
  }, [prompt])

  // Handle proper mount/unmount animation
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    } else if (isAnimating) {
      // Delay hiding the component until animation completes
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isAnimating])

  // Don't render if not open and not animating
  if (!prompt || (!isOpen && !isAnimating)) return null

  const handleCopyJson = () => {
    const jsonData = prompt.type === 'regular' 
      ? {
          description: prompt.description,
          style: prompt.style,
          camera: prompt.camera,
          lighting: prompt.lighting,
          environment: prompt.environment,
          elements: prompt.elements,
          motion: prompt.motion,
          ending: prompt.ending,
          text: prompt.text,
          keywords: prompt.keywords
        }
      : {
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
  }

  const handleExport = () => {
    const jsonData = prompt.type === 'regular' 
      ? {
          description: prompt.description,
          style: prompt.style,
          camera: prompt.camera,
          lighting: prompt.lighting,
          environment: prompt.environment,
          elements: prompt.elements,
          motion: prompt.motion,
          ending: prompt.ending,
          text: prompt.text,
          keywords: prompt.keywords
        }
      : {
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
    const exportFileDefaultName = `${prompt.title.toLowerCase().replace(/\s+/g, '-')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Side sheet */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-3xl bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                {prompt.category}
              </Badge>
              {prompt.type === 'timeline' && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                  Timeline
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Title and Description */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{prompt.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{prompt.description}</p>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={`gap-2 transition-all ${
                    isFavorited 
                      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                      : "hover:bg-gray-100"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
                  {isFavorited ? "Favorited" : "Favorite"}
                </Button>

                <Link href={`/dashboard/editor?remix${prompt.type === 'timeline' ? '-timeline' : ''}=${prompt.id}`}>
                  <Button variant="outline" className="gap-2 hover:bg-gray-100">
                    <Edit className="w-4 h-4" />
                    Remix
                  </Button>
                </Link>

                <Button onClick={handleExport} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  Export JSON
                </Button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-gray-50 rounded-2xl overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("readable")}
                    className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                      activeTab === "readable"
                        ? "border-blue-500 text-blue-600 bg-white"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("json")}
                    className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                      activeTab === "json"
                        ? "border-blue-500 text-blue-600 bg-white"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === "readable" ? (
                  <div className="space-y-6">
                    {prompt.type === 'regular' ? (
                      // Regular prompt details
                      <>
                        <div className="grid md:grid-cols-2 gap-6">
                          <Card className="border-0 shadow-none bg-white">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Camera & Style
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">Style</h4>
                                <p className="text-gray-600">{prompt.style}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">Camera</h4>
                                <p className="text-gray-600">{prompt.camera}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">Lighting</h4>
                                <p className="text-gray-600">{prompt.lighting}</p>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-0 shadow-none bg-white">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  <path d="M9 12l2 2 4-4" />
                                </svg>
                                Environment & Motion
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">Environment</h4>
                                <p className="text-gray-600">{prompt.environment}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">Motion</h4>
                                <p className="text-gray-600">{prompt.motion}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">Ending</h4>
                                <p className="text-gray-600">{prompt.ending}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="border-0 shadow-none bg-white">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                              <Tag className="w-5 h-5 text-gray-500" />
                              Keywords
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {prompt.keywords.map((keyword: string, index: number) => (
                                <Badge key={index} variant="secondary" className="bg-gray-100">
                                  {keyword.trim()}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      // Timeline prompt details
                      <>
                        <div className="grid md:grid-cols-2 gap-6">
                          <Card className="border-0 shadow-none bg-white">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg font-semibold">Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">Base Style</h4>
                                <p className="text-gray-600">{prompt.base_style}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">Aspect Ratio</h4>
                                <p className="text-gray-600">{prompt.aspect_ratio}</p>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-0 shadow-none bg-white">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg font-semibold">Technical Setup</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">Camera Setup</h4>
                                <p className="text-gray-600">{prompt.camera_setup}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">Lighting</h4>
                                <p className="text-gray-600">{prompt.lighting}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="border-0 shadow-none bg-white">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">Scene Description</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-600">{prompt.scene_description}</p>
                          </CardContent>
                        </Card>

                        {prompt.negative_prompts && prompt.negative_prompts.length > 0 && (
                          <Card className="border-0 shadow-none bg-white">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg font-semibold">Negative Prompts</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {prompt.negative_prompts.map((negPrompt: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                                    {negPrompt}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <Card className="border-0 shadow-none bg-white">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">Timeline Sequence</CardTitle>
                          </CardHeader>
                          <CardContent>
                                                         <div className="space-y-4">
                               {prompt.timeline.map((step: { sequence: number; timestamp: string; action: string; audio: string }, index: number) => (
                                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      Sequence {step.sequence}
                                    </Badge>
                                    {step.timestamp && (
                                      <span className="text-sm text-gray-500">{step.timestamp}</span>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    {step.action && (
                                      <div>
                                        <h5 className="font-medium text-gray-700 text-sm">Action</h5>
                                        <p className="text-gray-600 text-sm">{step.action}</p>
                                      </div>
                                    )}
                                    {step.audio && (
                                      <div>
                                        <h5 className="font-medium text-gray-700 text-sm">Audio</h5>
                                        <p className="text-gray-600 text-sm">{step.audio}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                ) : (
                  <Card className="border-0 shadow-none bg-white">
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
                          onClick={handleCopyJson}
                          className="absolute right-2 top-2 z-10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm">
                          <code className="text-gray-900">
                            {JSON.stringify(
                              prompt.type === 'regular' 
                                ? {
                                    description: prompt.description,
                                    style: prompt.style,
                                    camera: prompt.camera,
                                    lighting: prompt.lighting,
                                    environment: prompt.environment,
                                    elements: prompt.elements,
                                    motion: prompt.motion,
                                    ending: prompt.ending,
                                    text: prompt.text,
                                    keywords: prompt.keywords
                                  }
                                : {
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
                                  }, 
                              null, 
                              2
                            )}
                          </code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 