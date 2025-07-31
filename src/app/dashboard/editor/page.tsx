"use client"

import { useSearchParams } from "next/navigation"
import { PromptEditor } from "@/components/prompt-editor"
import { TimelinePromptEditor } from "@/components/timeline-prompt-editor"

export default function EditorPage() {
  const searchParams = useSearchParams()
  const isTimelinePrompt = searchParams.has('remix-timeline')

  return (
    <div className="min-h-screen bg-gray-50">
      {isTimelinePrompt ? <TimelinePromptEditor /> : <PromptEditor />}
    </div>
  )
} 