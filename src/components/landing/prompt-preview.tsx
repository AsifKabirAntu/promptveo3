"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Sparkles, 
  Clock, 
  Heart, 
  Eye, 
  Copy, 
  Download, 
  Play,
  Code,
  FileText,
  Zap,
  Camera,
  Lightbulb,
  Globe,
  Move,
  Tag
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

// Sample featured prompts data based on actual app structure
const featuredRegularPrompt = {
  id: "featured-regular-1",
  title: "Epic Mountain Vista",
  description: "A breathtaking panoramic view of snow-capped mountain peaks bathed in golden morning light, with dramatic clouds rolling through the valleys below.",
  style: "Cinematic",
  camera: "Wide establishing shot, slowly pushing forward",
  lighting: "Golden hour, warm sunlight filtering through clouds",
  environment: "High altitude mountain peak at sunrise",
  elements: ["snow-covered peaks", "rolling clouds", "dramatic sky", "alpine landscape"],
  motion: "Slow forward push, slight tilt up to reveal scale",
  ending: "Hold on the vast mountain range",
  text: "none",
  keywords: ["mountains", "epic", "sunrise", "nature", "landscape"],
  category: "Nature",
  is_featured: true,
  is_public: true,
  likes_count: 127,
  usage_count: 89
}

const featuredTimelinePrompt = {
  id: "featured-timeline-1",
  title: "Toy Robot Cinematic Build",
  description: "A timeline-based cinematic unboxing and self-assembly of the Toy Robot set in a creatively staged environment.",
  category: "Creative",
  base_style: "cinematic",
  aspect_ratio: "16:9",
  scene_description: "A chrome box lies at the foot of a child's bed, glowing faintly in the dark room.",
  camera_setup: "overhead top-down locked camera",
  lighting: "soft ambient bounce",
  negative_prompts: ["no people", "no text overlays", "no distracting music"],
  timeline: [
    {
      sequence: 1,
      timestamp: "00:00-00:01",
      action: "The Toy Robot box begins to glow and vibrate gently.",
      audio: "Low rumble or pulsing hum"
    },
    {
      sequence: 2,
      timestamp: "00:01-00:02",
      action: "The box bursts open with particles or steam revealing floating core components.",
      audio: "Sharp cinematic pop with rising whoosh"
    },
    {
      sequence: 3,
      timestamp: "00:02-00:05",
      action: "All parts of the Toy Robot fly into place, assembling mid-air in a choreographed motion.",
      audio: "Clicks, swirls, and ambient tech tones"
    },
    {
      sequence: 4,
      timestamp: "00:05-00:07",
      action: "The fully assembled Toy Robot lands softly into the scene. Accent lights animate around it.",
      audio: "Subtle swoosh and confirming tone"
    }
  ],
  is_featured: true,
  is_public: true,
  likes_count: 203,
  usage_count: 156
}

export function PromptPreview() {
  const [activeTab, setActiveTab] = useState<"regular" | "timeline">("regular")

  const handleCopyJson = (jsonData: Record<string, unknown>, promptTitle: string) => {
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
    toast.success(`JSON copied to clipboard!`, {
      description: `"${promptTitle}" prompt data copied.`
    })
  }

  const handleDownloadJson = (jsonData: Record<string, unknown>, promptTitle: string) => {
    const dataStr = JSON.stringify(jsonData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `${promptTitle.toLowerCase().replace(/\s+/g, '-')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success(`JSON downloaded!`, {
      description: `"${promptTitle}" prompt saved as ${exportFileDefaultName}`
    })
  }

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Featured Prompts
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl mb-4">
            See the Power of Structured Prompts
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore our featured prompts to see how structured data creates stunning Veo 3 videos. 
            From cinematic landscapes to timeline-based sequences.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "regular" | "timeline")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="regular" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Regular Prompt
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline Prompt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="regular" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Prompt Details */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                        {featuredRegularPrompt.category}
                      </Badge>
                      <Badge variant="outline" className="bg-gray-50">
                        {featuredRegularPrompt.style}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {featuredRegularPrompt.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                      {featuredRegularPrompt.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Camera className="w-4 h-4" />
                          Camera
                        </div>
                        <p className="text-sm text-gray-600">{featuredRegularPrompt.camera}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Lightbulb className="w-4 h-4" />
                          Lighting
                        </div>
                        <p className="text-sm text-gray-600">{featuredRegularPrompt.lighting}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Globe className="w-4 h-4" />
                          Environment
                        </div>
                        <p className="text-sm text-gray-600">{featuredRegularPrompt.environment}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Move className="w-4 h-4" />
                          Motion
                        </div>
                        <p className="text-sm text-gray-600">{featuredRegularPrompt.motion}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Tag className="w-4 h-4" />
                        Keywords
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {featuredRegularPrompt.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                            {keyword}
                          </Badge>
          ))}
        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyJson(featuredRegularPrompt, featuredRegularPrompt.title)}
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy JSON
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleDownloadJson(featuredRegularPrompt, featuredRegularPrompt.title)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* JSON Preview */}
                <Card className="border-0 shadow-lg bg-gray-900">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      JSON Structure
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      The structured data that powers Veo 3 generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm max-h-96 overflow-y-auto">
                      <code className="text-green-400 font-mono">
                        {JSON.stringify(featuredRegularPrompt, null, 2)}
                      </code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Timeline Prompt Details */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                        {featuredTimelinePrompt.category}
                      </Badge>
                      <Badge variant="outline" className="bg-gray-50">
                        {featuredTimelinePrompt.base_style}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {featuredTimelinePrompt.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                      {featuredTimelinePrompt.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Globe className="w-4 h-4" />
                          Scene Description
                        </div>
                        <p className="text-sm text-gray-600">{featuredTimelinePrompt.scene_description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Camera className="w-4 h-4" />
                            Camera Setup
                          </div>
                          <p className="text-sm text-gray-600">{featuredTimelinePrompt.camera_setup}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Lightbulb className="w-4 h-4" />
                            Lighting
                          </div>
                          <p className="text-sm text-gray-600">{featuredTimelinePrompt.lighting}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Clock className="w-4 h-4" />
                          Timeline Sequence
                        </div>
                        <div className="space-y-2">
                          {featuredTimelinePrompt.timeline.slice(0, 3).map((step, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-500">Step {step.sequence}</span>
                                <span className="text-xs text-gray-500">{step.timestamp}</span>
                              </div>
                              <p className="text-sm text-gray-700">{step.action}</p>
                            </div>
                          ))}
                          {featuredTimelinePrompt.timeline.length > 3 && (
            <div className="text-center">
                              <Badge variant="outline" className="text-xs">
                                +{featuredTimelinePrompt.timeline.length - 3} more steps
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopyJson(featuredTimelinePrompt, featuredTimelinePrompt.title)}
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy JSON
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleDownloadJson(featuredTimelinePrompt, featuredTimelinePrompt.title)}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
            </div>
            </div>
                  </CardContent>
                </Card>

                {/* JSON Preview */}
                <Card className="border-0 shadow-lg bg-gray-900">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Timeline JSON Structure
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Sequential data with timestamps and audio cues
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm max-h-96 overflow-y-auto">
                      <code className="text-green-400 font-mono">
                        {JSON.stringify(featuredTimelinePrompt, null, 2)}
                      </code>
                    </pre>
                  </CardContent>
                </Card>
            </div>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-12">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Zap className="w-5 h-5 mr-2" />
                Ready to create your own?
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
} 