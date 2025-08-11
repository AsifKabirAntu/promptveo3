'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ChevronRight, Sparkles, Loader2, Heart, Copy, Edit, Download, Clock, Eye, Tag, Lock, Check, Save } from 'lucide-react'
import { UserProduct, PromptGenerationRequest, PromptGenerationResponse } from '../../types'
import { analyzeProductImage, generatePrompt } from '../../services/api'
import { canUserGeneratePrompt } from '../../services/usage-api'
import { TimelinePromptDetail } from '@/components/timeline-prompt-detail'
import { Paywall } from '@/components/ui/paywall'
import { formatDate } from '@/lib/utils'
import { createUserPrompt } from '@/lib/user-prompts-client'
import { toast } from 'sonner'

interface PromptGenerationWizardProps {
  product: UserProduct
  onClose: () => void
}

interface StyleOption {
  id: string
  name: string
  description: string
  base_style: string
}

interface CameraOption {
  id: string
  name: string
  description: string
  setup: string
}

interface GeneratedPrompt {
  title?: string
  description?: string
  prompt?: string
  timeline?: Array<{
    sequence: number
    timestamp: string
    action: string
    audio: string
  }>
  scene_description?: string
  lighting?: string
  duration?: string
  aspectRatio?: string
  videoSettings?: {
    aspectRatio: string
    quality: string
    fps: number
  }
  metadata?: {
    productName: string
    styleTemplate: string
    generatedAt: string
    analysisVersion: string
  }
}

// Style options based on the actual base_styles from the JSON
const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'neon',
    name: 'Neon',
    description: 'Futuristic, glowing, cyber-punk aesthetic with vibrant neon elements',
    base_style: 'neon, photorealistic, 4K'
  },
  {
    id: 'dynamic',
    name: 'Dynamic',
    description: 'Energetic, movement-focused, active feel with powerful motion',
    base_style: 'dynamic, photorealistic, 4K'
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bright, colorful, high-energy visuals with bold contrast',
    base_style: 'vibrant, photorealistic, 4K'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated, refined, luxurious aesthetic with premium feel',
    base_style: 'elegant, photorealistic, 4K'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, simple, uncluttered design with focus on essentials',
    base_style: 'minimalist, photorealistic, 4K'
  },
  {
    id: 'futuristic',
    name: 'Futuristic',
    description: 'High-tech, sci-fi, advanced technology look',
    base_style: 'futuristic, photorealistic, 4K'
  },
  {
    id: 'sleek',
    name: 'Sleek',
    description: 'Modern, smooth, polished appearance with clean lines',
    base_style: 'sleek, photorealistic, 4K'
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Film-like, dramatic, storytelling quality with movie aesthetics',
    base_style: 'cinematic, photorealistic, 4K'
  },
  {
    id: 'natural',
    name: 'Natural',
    description: 'Organic, earth-tones, authentic feel with natural lighting',
    base_style: 'natural, photorealistic, 4K'
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft colors, gentle, dreamy aesthetic with subtle tones',
    base_style: 'pastel, photorealistic, 4K'
  }
]

// Camera setup options from the JSON data
const CAMERA_OPTIONS: CameraOption[] = [
  {
    id: 'orbit',
    name: '360-degree Orbit',
    description: 'Smooth circular movement around the product',
    setup: '360-degree orbit shot'
  },
  {
    id: 'tracking',
    name: 'Low-angle Tracking',
    description: 'Dynamic tracking shot from a low angle perspective',
    setup: 'low-angle tracking shot'
  },
  {
    id: 'drone',
    name: 'Drone Sweeping',
    description: 'Aerial-style sweeping movement with smooth transitions',
    setup: 'drone-like sweeping shot'
  },
  {
    id: 'topdown',
    name: 'Top-down Tilt',
    description: 'Starting from above and slowly tilting up to reveal',
    setup: 'top-down view slowly tilting up'
  },
  {
    id: 'steady',
    name: 'Steady Rotation',
    description: 'Stable camera with subtle rotating movement',
    setup: 'steady cam with subtle rotation'
  },
  {
    id: 'wideangle',
    name: 'Wide-angle Zoom',
    description: 'Fixed wide shot with gentle zoom for dramatic effect',
    setup: 'fixed wide-angle shot with slight zoom'
  },
  {
    id: 'macro',
    name: 'Macro Spiral',
    description: 'Close-up spiral movement showcasing fine details',
    setup: 'macro close-up spiral'
  },
  {
    id: 'dolly',
    name: 'Slow Dolly',
    description: 'Smooth forward movement with cinematic feel',
    setup: 'slow dolly forward'
  }
]

export function PromptGenerationWizard({ product, onClose }: PromptGenerationWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'style' | 'generating' | 'result'>('style')
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null)
  const [selectedCamera, setSelectedCamera] = useState<CameraOption | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("readable");
  const [showPaywall, setShowPaywall] = useState(false)

  // Auto-analyze product if not already analyzed
  useEffect(() => {
    if (product.analysis_data && Object.keys(product.analysis_data).length > 0) {
      setAnalysisData(product.analysis_data)
    } else {
      handleAnalysis()
    }
  }, [])

  const handleAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await analyzeProductImage(product.id)
      if (response.success) {
        setAnalysisData(response.analysis)
      } else {
        setError('Failed to analyze product image')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setError('Failed to analyze product image')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleStyleSelect = (style: StyleOption) => {
    setSelectedStyle(style)
    // Reset camera selection when style changes
    setSelectedCamera(null)
  }

  const handleCameraSelect = (camera: CameraOption) => {
    setSelectedCamera(camera)
  }

  const handleGenerate = async () => {
    if (!selectedStyle || !selectedCamera) {
      setError('Please select both style and camera setup')
      return
    }

    // Check if user can generate prompts
    const canGenerate = await canUserGeneratePrompt()
    if (!canGenerate) {
      setShowPaywall(true)
      return
    }

    setCurrentStep('generating')
    setIsGenerating(true)
    setError(null)

    try {
      // Create examples array from the JSON data to provide context to AI
      const examplePrompts = [
        {
          title: "Smartwatch Comet",
          base_style: "neon, photorealistic, 4K",
          camera_setup: "360-degree orbit shot",
          timeline: [
            { timestamp: "00:00.00-00:01.53", action: "Invisible forces pull pieces together smoothly." },
            { timestamp: "00:01.53-00:07.00", action: "Delicate panels unfold like petals." },
            { timestamp: "00:07.00-00:08.00", action: "Invisible forces pull pieces together smoothly." }
          ]
        },
        {
          title: "Electric Bike Blitz",
          base_style: "vibrant, photorealistic, 4K",
          camera_setup: "low-angle tracking shot",
          timeline: [
            { timestamp: "00:00.00-00:01.19", action: "Delicate panels unfold like petals." },
            { timestamp: "00:01.19-00:05.14", action: "The environment reacts with subtle changes as assembly occurs." },
            { timestamp: "00:05.14-00:08.00", action: "Invisible forces pull pieces together smoothly." }
          ]
        }
      ]

      const request = {
        productId: product.id,
        selectedStyle: selectedStyle,
        selectedCamera: selectedCamera,
        analysisData: analysisData,
        examplePrompts: examplePrompts
      }

      const response = await fetch('/api/product-analysis/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompt')
      }

      const result = await response.json()
      if (result.success) {
        setGeneratedPrompt(result.prompt)
        setCurrentStep('result')
        
        // Refresh usage data after successful generation
        window.dispatchEvent(new CustomEvent('usage-updated'))
      } else {
        setError('Failed to generate prompt')
        setCurrentStep('style')
      }
    } catch (error) {
      console.error('Generation error:', error)
      setError('Failed to generate prompt')
      setCurrentStep('style')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (currentStep === 'result' && generatedPrompt) {
    // Create custom result display that maintains the wizard navigation
    const promptData = {
      id: `generated-${Date.now()}`,
      title: generatedPrompt.title || `${selectedStyle?.name} ${product.name} Reveal`,
      description: generatedPrompt.description || generatedPrompt.prompt || `Cinematic ${selectedStyle?.name.toLowerCase()} product reveal featuring ${product.name}`,
      category: 'Product Reveal',
      base_style: selectedStyle?.base_style || '',
      aspect_ratio: generatedPrompt.videoSettings?.aspectRatio || '16:9',
      scene_description: generatedPrompt.scene_description || `${selectedStyle?.name} environment showcasing ${product.name}`,
      camera_setup: selectedCamera?.setup || '',
      lighting: generatedPrompt.lighting || 'dynamic lighting',
      negative_prompts: [],
      timeline: generatedPrompt.timeline || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'ai-generator',
      is_featured: false,
      is_public: false,
      likes_count: 0,
      usage_count: 0
    }

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Maintain consistent header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
              <div className="text-sm text-gray-400 truncate max-w-md">
                Products › {product.name.length > 25 ? `${product.name.slice(0, 25)}...` : product.name} › Result
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                  {promptData.category}
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                  Timeline
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">
                  ✨ AI Generated
                </Badge>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3">{promptData.title}</h1>
              <p className="text-lg text-gray-600">{promptData.description}</p>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    const jsonData = {
                      title: promptData.title,
                      description: promptData.description,
                      category: promptData.category,
                      base_style: promptData.base_style,
                      scene_description: promptData.scene_description,
                      camera_setup: promptData.camera_setup,
                      timeline: promptData.timeline
                    }
                    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
                  }}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy JSON
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      const saved = await createUserPrompt({
                        prompt_type: 'timeline',
                        title: promptData.title,
                        description: promptData.description,
                        category: promptData.category,
                        base_style: promptData.base_style,
                        aspect_ratio: promptData.aspect_ratio,
                        scene_description: promptData.scene_description,
                        camera_setup: promptData.camera_setup,
                        lighting: promptData.lighting,
                        negative_prompts: promptData.negative_prompts || [],
                        timeline_sequence: promptData.timeline || [],
                        is_public: false,
                        is_featured: false
                      })
                      if (saved) {
                        toast.success('Prompt saved to My Prompts')
                      } else {
                        toast.error('Failed to save prompt')
                      }
                    } catch (e) {
                      console.error(e)
                      toast.error('Failed to save prompt')
                    }
                  }}
                  className="gap-2 bg-gray-900 text-white hover:bg-black"
                >
                  <Save className="w-4 h-4" />
                  Save Prompt
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const content = `Title: ${promptData.title}\n\nDescription: ${promptData.description}\n\nStyle: ${promptData.base_style}\nCamera: ${promptData.camera_setup}\n\nTimeline:\n${promptData.timeline.map(t => `${t.timestamp}: ${t.action}`).join('\n')}`
                    navigator.clipboard.writeText(content)
                  }}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Text
                </Button>

                <Button
                  onClick={() => {
                    const jsonData = {
                      title: promptData.title,
                      description: promptData.description,
                      category: promptData.category,
                      base_style: promptData.base_style,
                      aspect_ratio: promptData.aspect_ratio,
                      scene_description: promptData.scene_description,
                      camera_setup: promptData.camera_setup,
                      lighting: promptData.lighting,
                      negative_prompts: promptData.negative_prompts,
                      timeline: promptData.timeline
                    }
                    const dataStr = JSON.stringify(jsonData, null, 2)
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
                    const exportFileDefaultName = `${promptData.title.toLowerCase().replace(/\s+/g, '-')}.json`
                    
                    const linkElement = document.createElement('a')
                    linkElement.setAttribute('href', dataUri)
                    linkElement.setAttribute('download', exportFileDefaultName)
                    linkElement.click()
                  }}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
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
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="border-0 shadow-none bg-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-semibold">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Base Style</h4>
                            <p className="text-gray-600">{promptData.base_style}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Aspect Ratio</h4>
                            <p className="text-gray-600">{promptData.aspect_ratio}</p>
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
                            <p className="text-gray-600">{promptData.camera_setup}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Lighting</h4>
                            <p className="text-gray-600">{promptData.lighting}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-0 shadow-none bg-white">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold">Scene Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{promptData.scene_description}</p>
                      </CardContent>
                    </Card>

                    {promptData.timeline && promptData.timeline.length > 0 && (
                      <Card className="border-0 shadow-none bg-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-semibold">Timeline Sequence</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {promptData.timeline.map((step, index) => (
                              <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    Sequence {step.sequence}
                                  </Badge>
                                  <span className="text-sm text-gray-500">{step.timestamp}</span>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <h5 className="font-medium text-gray-700 text-sm">Action</h5>
                                    <p className="text-gray-600 text-sm">{step.action}</p>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-700 text-sm">Dialogue</h5>
                                    <p className="text-gray-600 text-sm">{step.dialogue}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
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
                          onClick={() => {
                            const jsonData = {
                              title: promptData.title,
                              description: promptData.description,
                              category: promptData.category,
                              base_style: promptData.base_style,
                              aspect_ratio: promptData.aspect_ratio,
                              scene_description: promptData.scene_description,
                              camera_setup: promptData.camera_setup,
                              lighting: promptData.lighting,
                              negative_prompts: promptData.negative_prompts,
                              timeline: promptData.timeline
                            }
                            navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
                          }}
                          className="absolute right-2 top-2 z-10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm">
                          <code className="text-gray-900">
                            {JSON.stringify({
                              title: promptData.title,
                              description: promptData.description,
                              category: promptData.category,
                              base_style: promptData.base_style,
                              aspect_ratio: promptData.aspect_ratio,
                              scene_description: promptData.scene_description,
                              camera_setup: promptData.camera_setup,
                              lighting: promptData.lighting,
                              negative_prompts: promptData.negative_prompts,
                              timeline: promptData.timeline
                            }, null, 2)}
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
    )
  }

        return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
            <div className="text-sm text-gray-400 truncate max-w-md">
              Products › {product.name.length > 25 ? `${product.name.slice(0, 25)}...` : product.name} › Select Style & Camera
            </div>
          </div>
            </div>

        {/* Linear Product Header */}
        <div className="flex items-center gap-4 pb-8 border-b border-gray-100 mb-8">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 relative">
            <img 
              src={product.image_url || '/placeholder.png'} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide the broken image and show fallback
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
            <div className="fallback-icon absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate" title={product.name}>
              {product.name.length > 60 ? `${product.name.slice(0, 60)}...` : product.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-blue-600 font-medium">Product Reveal Generator</span>
                </div>
                </div>
              </div>

        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Product</h3>
              <p className="text-gray-600">AI is analyzing your product to understand its characteristics...</p>
                  </div>
                </div>
              )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Linear Step Content */}
        {currentStep === 'style' && !isAnalyzing && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">✨ Try Enhanced Multi-Scene Generation</h3>
                <p className="text-sm text-blue-700">
                  Create professional videos with multiple 8-second scenes using advanced styles like Cinematic, AI Vlogs, ASMR, and more.
                </p>
              </div>
              <Button 
                onClick={() => router.push(`/dashboard/products/${product.id}/generate-enhanced`)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Try Enhanced Mode
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'style' && analysisData && (
          <div className="space-y-8">
            {/* Linear Style Selection */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Choose Style</h2>
                    <p className="text-sm text-gray-500">Select visual aesthetic</p>
                  </div>
                </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {STYLE_OPTIONS.map((style, index) => {
                  const gradients = [
                    'from-pink-500 to-rose-500', 'from-blue-500 to-cyan-500', 'from-violet-500 to-purple-500',
                    'from-emerald-500 to-teal-500', 'from-orange-500 to-red-500', 'from-indigo-500 to-blue-500',
                    'from-gray-700 to-gray-900', 'from-amber-500 to-orange-500', 'from-green-500 to-emerald-500',
                    'from-purple-500 to-pink-500'
                  ]
                  const gradient = gradients[index % gradients.length]
                  
                  return (
                                          <div 
                        key={style.id}
                        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] relative overflow-hidden rounded-lg border-2 ${
                          selectedStyle?.id === style.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => handleStyleSelect(style)}
                      >
                        <div className="p-4">
                          {/* Linear layout */}
                          <div className="flex items-start gap-3">
                           
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 text-sm mb-1">{style.name}</h3>
                              <p className="text-xs text-gray-500 leading-relaxed" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {style.description}
                              </p>
                            </div>
                            {selectedStyle?.id === style.id && (
                              <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            )}
                          </div>
            </div>
          </div>
        )
                })}
              </div>
            </div>

            {/* Linear Camera Selection */}
            {selectedStyle && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">2</span>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Choose Camera</h2>
                      <p className="text-sm text-gray-500">Select movement style</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {CAMERA_OPTIONS.map((camera, index) => {
                    const gradients = [
                      'from-emerald-500 to-teal-600', 'from-blue-600 to-indigo-600', 'from-purple-600 to-violet-600',
                      'from-orange-500 to-red-500', 'from-cyan-500 to-blue-500', 'from-pink-500 to-rose-500',
                      'from-amber-500 to-orange-500', 'from-green-600 to-emerald-600'
                    ]
                    const gradient = gradients[index % gradients.length]
                    
                    return (
                      <div 
                        key={camera.id}
                        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] relative overflow-hidden rounded-lg border-2 ${
                          selectedCamera?.id === camera.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => handleCameraSelect(camera)}
                      >
                        <div className="p-4">
                          {/* Linear layout */}
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 text-sm mb-1">{camera.name}</h3>
                              <p className="text-xs text-gray-500 leading-relaxed" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {camera.description}
                              </p>
                            </div>
                            {selectedCamera?.id === camera.id && (
                              <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                        </div>
                      </div>
                    )}

                {/* Generate Section */}
                {selectedStyle && selectedCamera && (
                  <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-green-600">3</span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Generate</h3>
                        <p className="text-sm text-gray-500">Create your video prompt</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleGenerate}
                      size="lg"
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Video Prompt
                    </Button>
                  </div>
                )}
              </div>
            )}

        {/* Modern Generating Step */}
        {currentStep === 'generating' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              {/* Modern loading animation */}
              <div className="relative mb-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
                  </div>
                </div>
                <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
              
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                PromptVeo3 AI is generating your prompt
              </h3>
              <p className="text-gray-600 text-lg">
                Creating a personalized video prompt with {selectedStyle?.name} style and {selectedCamera?.name} camera movement
              </p>
            </div>

            {/* Linear progress steps */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">Product Analysis Complete</div>
                  <div className="text-sm text-blue-700">PromptVeo3 AI analyzed your product characteristics</div>
                </div>
          </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">Style Selected: {selectedStyle?.name}</div>
                  <div className="text-sm text-blue-700">{selectedStyle?.description}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">Camera Setup: {selectedCamera?.name}</div>
                  <div className="text-sm text-blue-700">{selectedCamera?.description}</div>
              </div>
            </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">Generating Video Prompt...</div>
                  <div className="text-sm text-blue-700">PromptVeo3 AI is crafting your personalized Veo3 prompt</div>
                </div>
              </div>
            </div>

            {/* Animated progress bar */}
            <div className="mt-8 mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Processing</span>
                <span>Almost done...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-md">
            <Paywall
              title="Prompt Generation Limit Reached"
              description="You've reached your monthly prompt generation limit. Upgrade to Pro for 40 prompts per month."
              feature="More prompt generations"
              onClose={() => setShowPaywall(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
} 