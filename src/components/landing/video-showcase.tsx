"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Code,
  Copy,
  Download,
  Zap,
  Camera,
  Lightbulb,
  Globe,
  Move,
  Tag,
  Square
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { toast } from "sonner"
import Link from "next/link"

// LEGO prompt data
const legoPrompt = {
  description: "Photorealistic cinematic shot of a grey child's room. A sealed LEGO box with brick pattern sits in the center. It bounces, then bursts open into a storm of bricks. The room transforms into a colorful LEGO building zone.",
  style: "blocky playful realism",
  camera: "top-down timelapse reveal",
  lighting: "even daylight with pops of color",
  environment: "plain room becomes LEGO creative room",
  elements: [
    "brick walls",
    "buildable furniture",
    "LEGO-themed posters",
    "oversized LEGO chair",
    "scattered mini-figures",
    "stackable desk"
  ],
  motion: "box bursts and bricks fly to build entire structures rapidly",
  ending: "camera flies over completed LEGO zone",
  text: "none",
  keywords: [
    "16:9",
    "LEGO",
    "bricks",
    "creative",
    "room transformation"
  ]
}

export function VideoShowcase() {
  const [activeTab, setActiveTab] = useState<"fast" | "quality">("fast")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(legoPrompt, null, 2))
    toast.success(`JSON copied to clipboard!`, {
      description: `"LEGO Room Transformation" prompt data copied.`
    })
  }

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(legoPrompt, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `lego-room-transformation.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success(`JSON downloaded!`, {
      description: `"LEGO Room Transformation" prompt saved as ${exportFileDefaultName}`
    })
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
        <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 mb-6 sm:mb-8 gap-2">
            <Logo size={24} />
            Video Output
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl xl:text-5xl mb-4">
            See Our Prompts Come to Life
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            Watch how our structured prompts transform into stunning Veo 3 videos. 
            From LEGO room transformations to cinematic sequences.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Video Player */}
            <div className="order-2 lg:order-1">
              <Card className="border-0 shadow-xl bg-white overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Play className="w-5 h-5 text-blue-600" />
                      Generated Video
                    </CardTitle>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Veo 3
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-600">
                    Room transformation sequence generated from structured prompt
                  </CardDescription>
                </CardHeader>
                                 <CardContent className="p-0">
                   <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "fast" | "quality")} className="w-full px-4">
                     <TabsList className="flex w-full mb-4">
                       <TabsTrigger value="fast" className="flex-1 text-xs px-2 flex items-center gap-1 justify-center">
                         <Zap className="w-3 h-3" />
                         <span>Fast</span>
                       </TabsTrigger>
                       <TabsTrigger value="quality" className="flex-1 text-xs px-2 flex items-center gap-1 justify-center">
                         <Maximize2 className="w-3 h-3" />
                         <span>Quality</span>
                       </TabsTrigger>
                     </TabsList>

                    <TabsContent value="fast" className="space-y-4">
                      <div className="relative bg-gray-900 rounded-lg mx-4 mb-4 overflow-hidden">
                                                 <video
                           className="w-full aspect-video object-cover"
                           controls
                           preload="metadata"
                         >
                           <source src="/video/veo3-fast.mp4" type="video/mp4" />
                           Your browser does not support the video tag.
                         </video>
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-black/50 text-white hover:bg-black/70"
                            onClick={toggleMute}
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="px-4 pb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Zap className="w-4 h-4 text-blue-500" />
                          <span>Fast generation mode - optimized for speed</span>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="quality" className="space-y-4">
                      <div className="relative bg-gray-900 rounded-lg mx-4 mb-4 overflow-hidden">
                                                 <video
                           className="w-full aspect-video object-cover"
                           controls
                           preload="metadata"
                         >
                           <source src="/video/veo3-quality.mp4" type="video/mp4" />
                           Your browser does not support the video tag.
                         </video>
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-black/50 text-white hover:bg-black/70"
                            onClick={toggleMute}
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="px-4 pb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Maximize2 className="w-4 h-4 text-purple-500" />
                          <span>Quality mode - enhanced visual fidelity</span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Prompt Details */}
            <div className="order-1 lg:order-2">
              <Card className="border-0 shadow-xl bg-white h-full">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                    <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 w-fit">
                      Room Transformation
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 w-fit">
                      {legoPrompt.style}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                    LEGO Room Transformation
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-sm sm:text-base">
                    {legoPrompt.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="details" className="w-full px-4">
                    <TabsList className="flex w-full mb-4">
                      <TabsTrigger value="details" className="flex-1 text-xs px-2">
                        Details
                      </TabsTrigger>
                      <TabsTrigger value="json" className="flex-1 text-xs px-2">
                        JSON
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 sm:space-y-6 px-4 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Camera className="w-4 h-4 flex-shrink-0" />
                            Camera
                          </div>
                          <p className="text-sm text-gray-600">{legoPrompt.camera}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Lightbulb className="w-4 h-4 flex-shrink-0" />
                            Lighting
                          </div>
                          <p className="text-sm text-gray-600">{legoPrompt.lighting}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Globe className="w-4 h-4 flex-shrink-0" />
                            Environment
                          </div>
                          <p className="text-sm text-gray-600">{legoPrompt.environment}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Move className="w-4 h-4 flex-shrink-0" />
                            Motion
                          </div>
                          <p className="text-sm text-gray-600">{legoPrompt.motion}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Tag className="w-4 h-4 flex-shrink-0" />
                          Keywords
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {legoPrompt.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>

                    </TabsContent>

                    <TabsContent value="json" className="px-4 pb-4">
                      <div className="space-y-4">
                        
                        <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                            {JSON.stringify(legoPrompt, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          
        </div>
        <div className="text-center mt-8 sm:mt-12">
            <Link href="/auth/signup">
              <Button size="lg" className="px-6 sm:px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="hidden sm:inline">Ready to create your own?</span>
                <span className="sm:hidden">Get Started</span>
              </Button>
            </Link>
          </div>
      </div>
    </section>
  )
} 