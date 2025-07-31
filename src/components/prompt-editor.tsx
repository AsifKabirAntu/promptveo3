"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Save, Download, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { fallbackCategories, fallbackStyles, getAllPromptsClient, getUniqueCategories, getUniqueStyles } from "@/lib/prompts-client"
import { getAllTimelinePromptsClient } from "@/lib/timeline-prompts-client"
import { createUserPrompt } from "@/lib/user-prompts-client"
import { Prompt, PromptFormData } from "@/types/prompt"
import { TimelinePrompt } from "@/types/timeline-prompt"

interface PromptEditorProps {
  isCreateMode?: boolean
}

export function PromptEditor({ isCreateMode = false }: PromptEditorProps) {
  const searchParams = useSearchParams()
  const remixId = !isCreateMode ? searchParams.get('remix') : null
  const remixTimelineId = !isCreateMode ? searchParams.get('remix-timeline') : null
  
  const [formData, setFormData] = useState<PromptFormData>({
    title: "",
    description: "",
    style: "",
    camera: "",
    lighting: "",
    environment: "",
    elements: [],
    motion: "",
    ending: "",
    text: "none",
    keywords: [],
    timeline: "",
    category: "",
    is_featured: false,
    is_public: true
  })

  const [newElement, setNewElement] = useState("")
  const [newKeyword, setNewKeyword] = useState("")
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<string[]>(fallbackCategories)
  const [styles, setStyles] = useState<string[]>(fallbackStyles)

  // Load prompt data for remixing and filter options
  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedCategories, fetchedStyles] = await Promise.all([
          getUniqueCategories(),
          getUniqueStyles()
        ])
        
        if (fetchedCategories.length > 0) setCategories(fetchedCategories)
        if (fetchedStyles.length > 0) setStyles(fetchedStyles)

        if (remixId) {
          const fetchedPrompts = await getAllPromptsClient()
          const originalPrompt = fetchedPrompts.find((p: Prompt) => p.id === remixId)
          if (originalPrompt) {
            setFormData({
              title: `${originalPrompt.title} (Remix)`,
              description: originalPrompt.description,
              style: originalPrompt.style,
              camera: originalPrompt.camera,
              lighting: originalPrompt.lighting,
              environment: originalPrompt.environment,
              elements: [...originalPrompt.elements],
              motion: originalPrompt.motion,
              ending: originalPrompt.ending,
              text: originalPrompt.text,
              keywords: [...originalPrompt.keywords],
              timeline: originalPrompt.timeline || "",
              category: originalPrompt.category,
              is_featured: false,
              is_public: true
            })
          }
        } else if (remixTimelineId) {
          const fetchedTimelinePrompts = await getAllTimelinePromptsClient()
          const originalPrompt = fetchedTimelinePrompts.find((p: TimelinePrompt) => p.id === remixTimelineId)
          if (originalPrompt) {
            // Create a more detailed timeline string from the timeline array
            const timelineString = originalPrompt.timeline.map(step => (
              `Sequence ${step.sequence} (${step.timestamp}):\n` +
              `Action: ${step.action}\n` +
              `Audio: ${step.audio}\n`
            )).join('\n\n')

            // Map all fields from timeline prompt to regular prompt format
            setFormData({
              title: `${originalPrompt.title} (Remix)`,
              description: originalPrompt.description,
              style: originalPrompt.base_style || "",
              camera: originalPrompt.camera_setup || "",
              lighting: originalPrompt.lighting || "",
              environment: originalPrompt.scene_description || "",
              elements: originalPrompt.negative_prompts || [], // Use negative prompts as elements
              motion: "Timeline-based motion", // Default value for timeline prompts
              ending: "See timeline sequence", // Reference to check timeline
              text: "none",
              keywords: [], // Initialize empty keywords array
              timeline: timelineString, // Formatted timeline string
              category: originalPrompt.category || "",
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
  }, [remixId, remixTimelineId])

  const handleInputChange = (field: keyof PromptFormData, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addElement = () => {
    if (newElement.trim()) {
      setFormData(prev => ({
        ...prev,
        elements: [...prev.elements, newElement.trim()]
      }))
      setNewElement("")
    }
  }

  const removeElement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.filter((_, i) => i !== index)
    }))
  }

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }))
      setNewKeyword("")
    }
  }

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a title for your prompt")
      return
    }

    try {
      const promptData = {
        prompt_type: 'regular' as const,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        style: formData.style,
        camera: formData.camera,
        lighting: formData.lighting,
        environment: formData.environment,
        elements: formData.elements,
        motion: formData.motion,
        ending: formData.ending,
        text: formData.text,
        keywords: formData.keywords,
        timeline: formData.timeline || undefined,
        is_public: formData.is_public,
        is_featured: formData.is_featured
      }

      const savedPrompt = await createUserPrompt(promptData)
      if (savedPrompt) {
        alert("Prompt saved successfully!")
        if (isCreateMode) {
          // Optionally redirect to My Prompts page
          window.location.href = '/dashboard/my-prompts'
        }
      } else {
        alert("Failed to save prompt. Please try again.")
      }
    } catch (error) {
      console.error("Error saving prompt:", error)
      alert("Failed to save prompt. Please try again.")
    }
  }

  const handleExport = () => {
    const jsonData = {
      description: formData.description,
      style: formData.style,
      camera: formData.camera,
      lighting: formData.lighting,
      environment: formData.environment,
      elements: formData.elements,
      motion: formData.motion,
      ending: formData.ending,
      text: formData.text,
      keywords: formData.keywords
    }
    
    const dataStr = JSON.stringify(jsonData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${formData.title.toLowerCase().replace(/\s+/g, '-')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const jsonPreview = {
    description: formData.description,
    style: formData.style,
    camera: formData.camera,
    lighting: formData.lighting,
    environment: formData.environment,
    elements: formData.elements,
    motion: formData.motion,
    ending: formData.ending,
    text: formData.text,
    keywords: formData.keywords,
    ...(formData.timeline && formData.timeline.trim() && { timeline: formData.timeline })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header - only show in remix mode */}
      {!isCreateMode && (
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {remixId ? "Remix Prompt" : "Create Prompt"}
              </h1>
              <p className="text-gray-600 mt-1">
                Build your cinematic prompt for Veo 3 with our structured editor
              </p>
            </div>
            
            <div className="flex space-x-3">
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
                Start with a title and description for your prompt
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
                  placeholder="Describe the scene you want to create..."
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
              <CardTitle>Visual Style</CardTitle>
              <CardDescription>
                Define the artistic style and camera work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Style
                </label>
                <Input
                  value={formData.style}
                  onChange={(e) => handleInputChange('style', e.target.value)}
                  placeholder="e.g., cinematic, vibrant, atmospheric"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Camera
                </label>
                <Input
                  value={formData.camera}
                  onChange={(e) => handleInputChange('camera', e.target.value)}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment & Motion</CardTitle>
              <CardDescription>
                Set the scene and define movement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environment
                </label>
                <Input
                  value={formData.environment}
                  onChange={(e) => handleInputChange('environment', e.target.value)}
                  placeholder="e.g., urban rooftop, forest clearing, space station"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motion
                </label>
                <Input
                  value={formData.motion}
                  onChange={(e) => handleInputChange('motion', e.target.value)}
                  placeholder="e.g., slow motion, dynamic action, gentle floating"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ending
                </label>
                <Input
                  value={formData.ending}
                  onChange={(e) => handleInputChange('ending', e.target.value)}
                  placeholder="e.g., fade to black, zoom out, cut to credits"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text
                </label>
                <Input
                  value={formData.text}
                  onChange={(e) => handleInputChange('text', e.target.value)}
                  placeholder="Usually 'none' for video prompts"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeline
                </label>
                <textarea
                  value={formData.timeline || ""}
                  onChange={(e) => handleInputChange('timeline', e.target.value)}
                  placeholder="Optional timeline description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Elements</CardTitle>
              <CardDescription>
                Add specific objects, characters, or details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-3">
                <Input
                  value={newElement}
                  onChange={(e) => setNewElement(e.target.value)}
                  placeholder="Add an element..."
                  onKeyPress={(e) => e.key === 'Enter' && addElement()}
                />
                <Button onClick={addElement} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.elements.map((element, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {element}
                    <button
                      onClick={() => removeElement(index)}
                      className="ml-1 hover:text-red-500"
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
              <CardTitle>Keywords</CardTitle>
              <CardDescription>
                Add searchable keywords and tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-3">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add a keyword..."
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button onClick={addKeyword} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <button
                      onClick={() => removeKeyword(index)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* JSON Preview */}
        <div className="lg:sticky lg:top-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Live JSON Preview</CardTitle>
              <CardDescription>
                This is the JSON that will be exported for Veo 3
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm max-h-[600px] overflow-y-auto">
                <code className="text-gray-900 font-mono">{JSON.stringify(jsonPreview, null, 2)}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 