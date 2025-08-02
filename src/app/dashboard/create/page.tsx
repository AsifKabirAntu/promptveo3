"use client"

import { useState } from "react"
import { ArrowLeft, FileText, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Paywall } from "@/components/ui/paywall"
import { useAuth } from "@/components/auth/auth-provider"
import Link from "next/link"
import { PromptEditor } from "@/components/prompt-editor"
import { TimelinePromptEditor } from "@/components/timeline-prompt-editor"

export default function CreatePromptPage() {
  const { features } = useAuth()
  const [activeTab, setActiveTab] = useState<"regular" | "timeline">("regular")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Prompt</h1>
              <p className="text-gray-600 mt-2">
                Build your own video generation prompt from scratch
              </p>
            </div>
            
            {/* Action buttons - will be controlled by active editor */}
            <div id="editor-actions" className="flex gap-3">
              {/* Buttons will be rendered here by the active editor */}
            </div>
          </div>

          {/* Prompt Type Tabs */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Choose Prompt Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={activeTab === "regular" ? "default" : "outline"}
                  onClick={() => setActiveTab("regular")}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <FileText className="w-4 h-4" />
                  Regular Prompt
                </Button>
                <Button
                  variant={activeTab === "timeline" ? "default" : "outline"}
                  onClick={() => setActiveTab("timeline")}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <Clock className="w-4 h-4" />
                  Timeline Prompt
                </Button>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {activeTab === "regular" ? (
                      <FileText className="w-3 h-3 text-blue-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      {activeTab === "regular" ? "Regular Prompt" : "Timeline Prompt"}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {activeTab === "regular" 
                        ? "Create a standard video prompt with style, camera, lighting, and scene elements."
                        : "Build a sequence-based prompt with timeline steps, timestamps, and audio instructions."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor Content */}
        {features.canCreate ? (
          <div className="relative">
            {activeTab === "regular" ? (
              <PromptEditor isCreateMode={true} />
            ) : (
              <TimelinePromptEditor isCreateMode={true} />
            )}
          </div>
        ) : (
          <div className="mt-8">
            <Paywall 
              title="Create Custom Prompts"
              description="Upgrade to Pro to create and save your own custom prompts."
              feature="Custom prompt creation"
              className="max-w-4xl mx-auto"
            />
          </div>
        )}
      </div>
    </div>
  )
} 