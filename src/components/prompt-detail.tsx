"use client"

import { useState } from "react"
import { ArrowLeft, Heart, Copy, Edit, Download, Clock, Eye, Tag } from "lucide-react"
import { Prompt } from "@/types/prompt"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface PromptDetailProps {
  prompt: Prompt
}

export function PromptDetail({ prompt }: PromptDetailProps) {
  const [activeTab, setActiveTab] = useState<"readable" | "json">("readable")
  const [isFavorited, setIsFavorited] = useState(false)

  const promptJson = {
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

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(promptJson, null, 2))
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(promptJson, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${prompt.title.toLowerCase().replace(/\s+/g, '-')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
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
            {prompt.style.split(', ').map((style, index) => (
              <Badge key={index} variant="outline" className="bg-gray-50">
                {style}
              </Badge>
            ))}
            {prompt.is_featured && (
              <Badge variant="default" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0">
                Featured
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">{prompt.title}</h1>
          <p className="text-lg text-gray-600">{prompt.description}</p>

          <div className="flex items-center gap-6 text-sm text-gray-500 mt-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Created {formatDate(new Date(prompt.created_at))}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>{prompt.likes_count} likes</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{prompt.usage_count} uses</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
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

            <Link href={`/dashboard/editor?remix=${prompt.id}`}>
              <Button variant="outline" className="gap-2 hover:bg-gray-100">
                <Edit className="w-4 h-4" />
                Remix Prompt
              </Button>
            </Link>

            <Button onClick={handleExport} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("readable")}
              className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                activeTab === "readable"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Human Readable
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                activeTab === "json"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              JSON Format
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "readable" ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Camera & Style
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Environment & Motion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

              <Card className="border-0 shadow-none bg-gray-50 md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Tag className="w-5 h-5 text-gray-500" />
                    Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {prompt.keywords.map((keyword: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-white">
                        {keyword.trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
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
                    onClick={handleCopyJson}
                    className="absolute right-2 top-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <pre className="bg-white rounded-lg p-4 overflow-x-auto text-sm">
                    <code className="text-gray-900">{JSON.stringify(promptJson, null, 2)}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 