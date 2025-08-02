"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Lock } from "lucide-react"
import { UnifiedPromptCard } from "@/components/unified-prompt-card"
import { PromptSideSheet } from "@/components/prompt-side-sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Paywall } from "@/components/ui/paywall"
import { useAuth } from "@/components/auth/auth-provider"
import { getAllPromptsClient, getUniqueCategories, getUniqueStyles, fallbackCategories, fallbackStyles } from "@/lib/prompts-client"
import { getAllTimelinePromptsClient, getUniqueTimelineCategories, getUniqueTimelineBaseStyles, fallbackTimelineCategories, fallbackTimelineBaseStyles } from "@/lib/timeline-prompts-client"
import { Prompt } from "@/types/prompt"
import { TimelinePrompt } from "@/types/timeline-prompt"

// Union type for unified prompt display
type UnifiedPrompt = (Prompt & { type: 'regular' }) | (TimelinePrompt & { type: 'timeline' })

export default function ExploreLibrary() {
  const { features } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedStyle, setSelectedStyle] = useState<string>("")
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'with-timeline' | 'without-timeline'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<UnifiedPrompt | null>(null)
  const [sideSheetOpen, setSideSheetOpen] = useState(false)
  
  // Separate state for regular and timeline prompts
  const [regularPrompts, setRegularPrompts] = useState<Prompt[]>([])
  const [timelinePrompts, setTimelinePrompts] = useState<TimelinePrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Categories and styles from both types
  const [categories, setCategories] = useState<string[]>(fallbackCategories)
  const [styles, setStyles] = useState<string[]>(fallbackStyles)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Starting to fetch data...')
      
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Data loading timeout')), 30000) // 30 second timeout
      })

      const regularPromptsPromise = getAllPromptsClient()
      const timelinePromptsPromise = getAllTimelinePromptsClient()

      const [regularPrompts, timelinePrompts] = await Promise.race([
        Promise.all([regularPromptsPromise, timelinePromptsPromise]),
        timeoutPromise
      ]) as [Prompt[], TimelinePrompt[]]

      setRegularPrompts(regularPrompts)
      setTimelinePrompts(timelinePrompts)
      setError(null)
    } catch (error) {
      console.error('Data fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
      // Set empty arrays as fallback
      setRegularPrompts([])
      setTimelinePrompts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={loadData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Regular Prompts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {regularPrompts.map((prompt) => (
          <div key={prompt.id} className="border p-4 rounded">
            <h3 className="font-bold">{prompt.title}</h3>
            <p>{prompt.description}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4">Timeline Prompts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timelinePrompts.map((prompt) => (
          <div key={prompt.id} className="border p-4 rounded">
            <h3 className="font-bold">{prompt.title}</h3>
            <p>{prompt.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 