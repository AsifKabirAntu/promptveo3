"use client"

import { useSearchParams } from "next/navigation"
import { PromptEditor } from "@/components/prompt-editor"
import { TimelinePromptEditor } from "@/components/timeline-prompt-editor"
import { Suspense } from "react"

// Client component that uses searchParams
function EditorContent() {
  const searchParams = useSearchParams()
  const isTimelinePrompt = searchParams.has('remix-timeline')

  return (
    <div className="min-h-screen bg-gray-50">
      {isTimelinePrompt ? <TimelinePromptEditor /> : <PromptEditor />}
    </div>
  )
}

// Main component with Suspense boundary
export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading editor...</div>}>
      <EditorContent />
    </Suspense>
  )
} 