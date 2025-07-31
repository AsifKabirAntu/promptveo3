import { PromptDetail } from "@/components/prompt-detail"
import { getPromptById } from "@/lib/prompts"
import { notFound } from "next/navigation"

interface PromptPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PromptPage({ params }: PromptPageProps) {
  const { id } = await params
  const prompt = await getPromptById(id)
  
  if (!prompt) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PromptDetail prompt={prompt} />
    </div>
  )
} 