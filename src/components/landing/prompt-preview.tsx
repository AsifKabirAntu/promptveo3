import { PromptCard } from "@/components/prompt-card"
import { getFeaturedPrompts } from "@/lib/prompts"

export async function PromptPreview() {
  // Show only featured prompts for the landing page
  const featuredPrompts = await getFeaturedPrompts()

  return (
    <section className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Featured Prompts
          </h2>
          <p className="mt-4 text-lg text-gray-800">
            Discover professionally crafted prompts for every creative vision
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredPrompts.map((prompt) => (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt} 
              showActions={false}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Join thousands of creators using PromptVeo3 for their video projects
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">500+</div>
              <div>Prompts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">10k+</div>
              <div>Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">2k+</div>
              <div>Creators</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 