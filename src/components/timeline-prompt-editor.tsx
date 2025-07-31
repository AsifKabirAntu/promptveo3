"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Save, Download, Plus, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { fallbackTimelineCategories, fallbackTimelineBaseStyles, getAllTimelinePromptsClient, getUniqueTimelineCategories, getUniqueTimelineBaseStyles } from "@/lib/timeline-prompts-client"
import { createUserPrompt } from "@/lib/user-prompts-client"
import { TimelinePrompt } from "@/types/timeline-prompt"

interface TimelineStep {
  sequence: number
  timestamp: string
  action: string
  audio: string
}

interface TimelineFormData {
  title: string
  description: string
  category: string
  base_style: string
  aspect_ratio: string
  scene_description: string
  camera_setup: string
  lighting: string
  negative_prompts: string[]
  timeline: TimelineStep[]
  is_featured: boolean
  is_public: boolean
}

interface TimelinePromptEditorProps {
  isCreateMode?: boolean
}

export function TimelinePromptEditor({ isCreateMode = false }: TimelinePromptEditorProps) {
  const searchParams = useSearchParams()
  const remixId = !isCreateMode ? searchParams.get('remix-timeline') : null
  
  const [formData, setFormData] = useState<TimelineFormData>({
    title: "",
    description: "",
    category: "",
    base_style: "",
    aspect_ratio: "16:9", // Default aspect ratio
    scene_description: "",
    camera_setup: "",
    lighting: "",
    negative_prompts: [],
    timeline: [{ sequence: 1, timestamp: "0:00", action: "", audio: "" }],
    is_featured: false,
    is_public: true
  })

  const [newNegativePrompt, setNewNegativePrompt] = useState("")
  const [categories, setCategories] = useState<string[]>(fallbackTimelineCategories)
  const [baseStyles, setBaseStyles] = useState<string[]>(fallbackTimelineBaseStyles)

  // Load data for remixing and filter options
  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedCategories, fetchedStyles] = await Promise.all([
          getUniqueTimelineCategories(),
          getUniqueTimelineBaseStyles()
        ])
        
        if (fetchedCategories.length > 0) setCategories(fetchedCategories)
        if (fetchedStyles.length > 0) setBaseStyles(fetchedStyles)

        if (remixId) {
          const fetchedPrompts = await getAllTimelinePromptsClient()
          const originalPrompt = fetchedPrompts.find((p: TimelinePrompt) => p.id === remixId)
          if (originalPrompt) {
            setFormData({
              title: `${originalPrompt.title} (Remix)`,
              description: originalPrompt.description,
              category: originalPrompt.category,
              base_style: originalPrompt.base_style,
              aspect_ratio: originalPrompt.aspect_ratio,
              scene_description: originalPrompt.scene_description,
              camera_setup: originalPrompt.camera_setup,
              lighting: originalPrompt.lighting,
              negative_prompts: [...originalPrompt.negative_prompts],
              timeline: [...originalPrompt.timeline],
              is_featured: false,
              is_public: true
            })
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [remixId])

  const handleInputChange = (
    field: keyof TimelineFormData,
    value: string | string[] | boolean | TimelineStep[]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addNegativePrompt = () => {
    if (newNegativePrompt.trim()) {
      setFormData(prev => ({
        ...prev,
        negative_prompts: [...prev.negative_prompts, newNegativePrompt.trim()]
      }))
      setNewNegativePrompt("")
    }
  }

  const removeNegativePrompt = (index: number) => {
    setFormData(prev => ({
      ...prev,
      negative_prompts: prev.negative_prompts.filter((_, i) => i !== index)
    }))
  }

  const addTimelineStep = () => {
    setFormData(prev => ({
      ...prev,
      timeline: [
        ...prev.timeline,
        {
          sequence: prev.timeline.length + 1,
          timestamp: "",
          action: "",
          audio: ""
        }
      ]
    }))
  }

  const updateTimelineStep = (index: number, field: keyof TimelineStep, value: string) => {
    setFormData(prev => ({
      ...prev,
      timeline: prev.timeline.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }))
  }

  const removeTimelineStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timeline: prev.timeline
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, sequence: i + 1 }))
    }))
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a title for your timeline prompt")
      return
    }

    try {
      const promptData = {
        prompt_type: 'timeline' as const,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        base_style: formData.base_style,
        aspect_ratio: formData.aspect_ratio,
        scene_description: formData.scene_description,
        camera_setup: formData.camera_setup,
        lighting: formData.lighting,
        negative_prompts: formData.negative_prompts,
        timeline_sequence: formData.timeline,
        is_public: formData.is_public,
        is_featured: formData.is_featured
      }

      const savedPrompt = await createUserPrompt(promptData)
      if (savedPrompt) {
        alert("Timeline prompt saved successfully!")
        if (isCreateMode) {
          // Optionally redirect to My Prompts page
          window.location.href = '/dashboard/my-prompts'
        }
      } else {
        alert("Failed to save timeline prompt. Please try again.")
      }
    } catch (error) {
      console.error("Error saving timeline prompt:", error)
      alert("Failed to save timeline prompt. Please try again.")
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `${formData.title.toLowerCase().replace(/\s+/g, '-')}-timeline.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header - only show in remix mode */}
      {!isCreateMode && (
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="group hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Library
            </Button>
          </Link>
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {remixId ? "Remix Timeline Prompt" : "Create Timeline Prompt"}
              </h1>
              <p className="text-gray-600 mt-1">
                Build your timeline-based prompt with sequence and audio
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Prompt
              </Button>
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons for create mode - render in header */}
      {isCreateMode && typeof window !== 'undefined' && (
        createPortal(
          <>
            <Button variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Prompt
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </>,
          document.getElementById('editor-actions') || document.body
        )
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Start with a title and description for your timeline prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a descriptive title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the scene sequence..."
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="">Select a category...</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visual Style & Setup</CardTitle>
              <CardDescription>
                Define the artistic style and technical parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Style
                </label>
                <select
                  value={formData.base_style}
                  onChange={(e) => handleInputChange('base_style', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="">Select a style...</option>
                  {baseStyles.map(style => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Camera Setup
                </label>
                <Input
                  value={formData.camera_setup}
                  onChange={(e) => handleInputChange('camera_setup', e.target.value)}
                  placeholder="e.g., wide shot, tracking shot, close-up"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lighting
                </label>
                <Input
                  value={formData.lighting}
                  onChange={(e) => handleInputChange('lighting', e.target.value)}
                  placeholder="e.g., golden hour, dramatic shadows, neon lighting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aspect Ratio
                </label>
                <select
                  value={formData.aspect_ratio}
                  onChange={(e) => handleInputChange('aspect_ratio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:3">4:3 (Classic)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scene Description</CardTitle>
              <CardDescription>
                Describe the overall scene and environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.scene_description}
                onChange={(e) => handleInputChange('scene_description', e.target.value)}
                placeholder="Describe the scene environment and setup..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-600"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Negative Prompts</CardTitle>
              <CardDescription>
                Add elements to avoid in the generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newNegativePrompt}
                  onChange={(e) => setNewNegativePrompt(e.target.value)}
                  placeholder="Add a negative prompt..."
                  onKeyPress={(e) => e.key === 'Enter' && addNegativePrompt()}
                />
                <Button onClick={addNegativePrompt} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.negative_prompts.map((prompt, index) => (
                  <Badge key={index} variant="secondary" className="bg-red-50 text-red-700 flex items-center gap-1">
                    {prompt}
                    <button
                      onClick={() => removeNegativePrompt(index)}
                      className="hover:text-red-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline Sequence</CardTitle>
              <CardDescription>
                Build your video timeline step by step
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.timeline.map((step, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Sequence {step.sequence}
                    </Badge>
                    <button
                      onClick={() => removeTimelineStep(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timestamp
                      </label>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <Input
                          value={step.timestamp}
                          onChange={(e) => updateTimelineStep(index, 'timestamp', e.target.value)}
                          placeholder="0:00"
                          className="pl-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action
                    </label>
                    <textarea
                      value={step.action}
                      onChange={(e) => updateTimelineStep(index, 'action', e.target.value)}
                      placeholder="Describe what happens in this sequence..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-600"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audio
                    </label>
                    <textarea
                      value={step.audio}
                      onChange={(e) => updateTimelineStep(index, 'audio', e.target.value)}
                      placeholder="Describe the audio/sound for this sequence..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-600"
                      rows={2}
                    />
                  </div>
                </div>
              ))}

              <Button 
                onClick={addTimelineStep}
                variant="outline"
                className="w-full mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Sequence
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Live JSON Preview</CardTitle>
              <CardDescription>
                This is the JSON that will be exported
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm max-h-[600px] overflow-y-auto">
                <code className="text-gray-900 font-mono">
                  {JSON.stringify(formData, null, 2)}
                </code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 