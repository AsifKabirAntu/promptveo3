import { notFound } from "next/navigation"
import { getTimelinePromptById } from "@/lib/timeline-prompts"
import { TimelinePromptDetail } from "@/components/timeline-prompt-detail"

interface TimelinePromptPageProps {
  params: Promise<{ id: string }>
}

export default async function TimelinePromptPage({ params }: TimelinePromptPageProps) {
  const { id } = await params
  const prompt = await getTimelinePromptById(id)

  if (!prompt) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <TimelinePromptDetail prompt={prompt} />
    </div>
  )
}

export async function generateMetadata({ params }: TimelinePromptPageProps) {
  const { id } = await params
  const prompt = await getTimelinePromptById(id)

  if (!prompt) {
    return {
      title: 'Timeline Prompt Not Found'
    }
  }

  return {
    title: `${prompt.title} | PromptVeo3`,
    description: prompt.description,
  }
} 