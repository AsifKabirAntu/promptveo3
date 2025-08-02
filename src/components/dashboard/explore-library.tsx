"use client"

import { useState, useEffect } from "react"
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

export function ExploreLibrary() {
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
  
  // Categories and styles from both types
  const [categories, setCategories] = useState<string[]>(fallbackCategories)
  const [styles, setStyles] = useState<string[]>(fallbackStyles)

  // Load all data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Data loading timeout')), 30000) // 30 second timeout for production
        })
        
        // Fetch both types of prompts and their metadata in parallel
        const dataPromise = Promise.all([
          getAllPromptsClient(),
          getAllTimelinePromptsClient(),
          getUniqueCategories(),
          getUniqueStyles(),
          getUniqueTimelineCategories(),
          getUniqueTimelineBaseStyles()
        ])
        
        const [
          fetchedRegularPrompts,
          fetchedTimelinePrompts,
          fetchedCategories,
          fetchedStyles,
          fetchedTimelineCategories,
          fetchedTimelineStyles
        ] = await Promise.race([dataPromise, timeoutPromise]) as any
        
        setRegularPrompts(fetchedRegularPrompts)
        setTimelinePrompts(fetchedTimelinePrompts)
        
        // Combine and deduplicate categories and styles
        const allCategories = [...new Set([...fetchedCategories, ...fetchedTimelineCategories])].sort()
        const allStyles = [...new Set([...fetchedStyles, ...fetchedTimelineStyles])].sort()
        
        if (allCategories.length > 0) setCategories(allCategories)
        if (allStyles.length > 0) setStyles(allStyles)
        
      } catch (error) {
        console.error('Error loading data:', error)
        // Set fallback data on error
        setRegularPrompts([])
        setTimelinePrompts([])
        
        // Log more details for debugging
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          })
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Convert prompts to unified format and filter based on current tab
  const getDisplayPrompts = (): { prompts: UnifiedPrompt[], totalCount: number, limitedCount: number } => {
    const unifiedRegular: UnifiedPrompt[] = regularPrompts.map(prompt => ({ ...prompt, type: 'regular' as const }))
    const unifiedTimeline: UnifiedPrompt[] = timelinePrompts.map(prompt => ({ ...prompt, type: 'timeline' as const }))
    
    // Filter based on tab selection
    let filteredPrompts: UnifiedPrompt[] = []
    
    if (timelineFilter === 'all') {
      filteredPrompts = [...unifiedRegular, ...unifiedTimeline]
    } else if (timelineFilter === 'with-timeline') {
      filteredPrompts = unifiedTimeline
    } else if (timelineFilter === 'without-timeline') {
      filteredPrompts = unifiedRegular
    }
    
    // Apply search and category/style filters
    const filtered = filteredPrompts.filter((prompt) => {
      const matchesSearch = !searchQuery || 
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = !selectedCategory || prompt.category === selectedCategory
      
      // Handle style matching for both types
      const promptStyle = prompt.type === 'timeline' ? 
        (prompt as TimelinePrompt).base_style : 
        (prompt as Prompt).style
      const matchesStyle = !selectedStyle || promptStyle === selectedStyle
      
      return matchesSearch && matchesCategory && matchesStyle
    })

    // Special handling for free users - consistent prompts across all tabs
    let limitedPrompts: UnifiedPrompt[] = []
    
    if (features.canViewAllPrompts) {
      // Pro users see all prompts
      limitedPrompts = filtered
    } else {
      // For free users, always use the same specific prompts across all tabs
      // Get the first 2 regular and first 1 timeline prompt that match filters
      const allRegular = unifiedRegular.filter(p => {
        const matchesSearch = !searchQuery || 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || p.category === selectedCategory
        const matchesStyle = !selectedStyle || (p as Prompt).style === selectedStyle
        return matchesSearch && matchesCategory && matchesStyle
      })
      
      const allTimeline = unifiedTimeline.filter(p => {
        const matchesSearch = !searchQuery || 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || p.category === selectedCategory
        const matchesStyle = !selectedStyle || (p as TimelinePrompt).base_style === selectedStyle
        return matchesSearch && matchesCategory && matchesStyle
      })
      
      // Always use the same specific prompts
      const staticRegular = allRegular.slice(0, 2)
      const staticTimeline = allTimeline.slice(0, 1)
      
      // Show different combinations based on tab
      if (timelineFilter === 'all') {
        // "All Prompts" tab: show 2 regular + 1 timeline
        limitedPrompts = [...staticRegular, ...staticTimeline]
      } else if (timelineFilter === 'with-timeline') {
        // "With Timeline" tab: show only the 1 timeline prompt
        limitedPrompts = staticTimeline
      } else if (timelineFilter === 'without-timeline') {
        // "Without Timeline" tab: show only the 2 regular prompts
        limitedPrompts = staticRegular
      }
    }

    // Calculate pagination using itemsPerPage instead of ITEMS_PER_PAGE
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedPrompts = limitedPrompts.slice(startIndex, startIndex + itemsPerPage)

    return {
      prompts: paginatedPrompts,
      totalCount: filtered.length,
      limitedCount: limitedPrompts.length
    }
  }

  const { prompts: displayPrompts, totalCount, limitedCount } = getDisplayPrompts()
  const totalPages = Math.ceil(limitedCount / itemsPerPage)
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedStyle, timelineFilter])

  const handleViewPrompt = (prompt: UnifiedPrompt) => {
    setSelectedPrompt(prompt)
    setSideSheetOpen(true)
  }

  const handleCloseSideSheet = () => {
    setSideSheetOpen(false)
    // Delay clearing the prompt to allow animation to complete
    setTimeout(() => setSelectedPrompt(null), 300)
  }

  // Get featured prompt for "Prompt of the Day"
  const promptOfTheDay = displayPrompts.length > 0 ? 
    (displayPrompts.find(p => p.is_featured) || displayPrompts[0]) : null

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prompts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Timeline Tabs */}
      <div className="mb-8">
        <div className="flex space-x-4">
          <button 
            onClick={() => setTimelineFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timelineFilter === 'all' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Prompts ({regularPrompts.length + timelinePrompts.length})
          </button>
          <button 
            onClick={() => setTimelineFilter('with-timeline')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timelineFilter === 'with-timeline' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            With Timeline ({timelinePrompts.length})
          </button>
          <button 
            onClick={() => setTimelineFilter('without-timeline')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timelineFilter === 'without-timeline' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Without Timeline ({regularPrompts.length})
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-6 mb-8">
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search prompts by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg rounded-2xl bg-white shadow-sm border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {/* Filter Header */}
          <div 
            className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-700">Filters</h3>
              {(selectedCategory || selectedStyle) && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {[selectedCategory, selectedStyle].filter(Boolean).length} active
                </span>
              )}
            </div>
            {filtersExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>

          {/* Collapsible Filter Content */}
          {filtersExpanded && (
            <div className="px-6 pb-6 space-y-6 border-t border-gray-100">
              {/* Category Filter */}
              <div>
                <div className="flex items-center gap-2 mb-3 mt-4">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-700">Category</h3>
                </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("")}
                  className={`rounded-full px-4 ${
                    selectedCategory === "" 
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                      : "hover:bg-gray-100"
                  }`}
                >
                  All
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 ${
                      selectedCategory === category 
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Style Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <h3 className="font-medium text-gray-700">Style</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedStyle === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStyle("")}
                  className={`rounded-full px-4 ${
                    selectedStyle === "" 
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                      : "hover:bg-gray-100"
                  }`}
                >
                  All
                </Button>
                {styles.map(style => (
                  <Button
                    key={style}
                    variant={selectedStyle === style ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle(style)}
                    className={`rounded-full px-4 ${
                      selectedStyle === style 
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Count and Page Size Control */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 border border-gray-200">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{displayPrompts.length}</span> of <span className="font-medium text-gray-900">{limitedCount}</span> prompts
          {!features.canViewAllPrompts && totalCount > limitedCount && (
            <span className="text-gray-500 ml-2">
              (of {totalCount} total - upgrade to see all)
            </span>
          )}
        </p>
        
        <div className="flex items-center gap-3">
          <label htmlFor="page-size" className="text-sm text-gray-600">
            Show per page:
          </label>
          <select
            id="page-size"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="text-sm rounded-lg border-gray-200 bg-gray-50 text-gray-900 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={9}>9</option>
            <option value={18}>18</option>
            <option value={27}>27</option>
            <option value={36}>36</option>
          </select>
        </div>
      </div>

      {/* Prompt Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayPrompts.map((prompt) => (
          <UnifiedPromptCard 
            key={`${prompt.type}-${prompt.id}`} 
            prompt={prompt}
            onViewPrompt={handleViewPrompt}
          />
        ))}
      </div>

      {/* Paywall for free users */}
      {!features.canViewAllPrompts && totalCount > limitedCount && (
        <div className="mt-8">
          <Paywall 
            title="Unlock All Prompts"
            description={`You're seeing ${limitedCount} of ${totalCount} prompts. Upgrade to Pro to access the full library.`}
            feature="Unlimited prompt access"
            className="max-w-4xl mx-auto"
          />
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-full px-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 p-0 rounded-full ${
                  currentPage === page 
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200" 
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full px-4"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search criteria or browse different categories.
          </p>
          <Button 
            onClick={() => {
              setSearchQuery("")
              setSelectedCategory("")
              setSelectedStyle("")
            }}
            variant="outline"
            className="rounded-full"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Side Sheet */}
      <PromptSideSheet 
        prompt={selectedPrompt}
        isOpen={sideSheetOpen}
        onClose={handleCloseSideSheet}
      />
    </div>
  )
} 