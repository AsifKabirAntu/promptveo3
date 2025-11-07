"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Lock, Users } from "lucide-react"
import { UnifiedPromptCard } from "@/components/unified-prompt-card"
import { PromptSideSheet } from "@/components/prompt-side-sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Paywall } from "@/components/ui/paywall"
import { useAuth } from "@/components/auth/auth-provider"
import { getAllPromptsClient, getUniqueCategories, fallbackCategories, FREE_VIEWABLE_REGULAR_PROMPTS } from "@/lib/prompts-client"
import { getAllTimelinePromptsClient, getUniqueTimelineCategories, fallbackTimelineCategories, FREE_VIEWABLE_TIMELINE_PROMPTS } from "@/lib/timeline-prompts-client"
import { getAllExplodedPromptsClient, FREE_VIEWABLE_EXPLODED_PROMPTS } from "@/lib/exploded-prompts-client"
import { Prompt } from "@/types/prompt"
import { TimelinePrompt } from "@/types/timeline-prompt"
import { ExplodedBuildPrompt } from "@/types/exploded-prompt"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FluxFrameInlineAd } from '@/components/ads/FluxFrameInlineAd'

// Community prompt interface
interface CommunityPrompt {
  id: string
  title: string
  description: string
  full_prompt_text: string
  veo3_prompt?: string
  clean_description?: string
  extracted_tags?: string[]
  prompt_category: string
  creator_name: string
  creator_profile_url?: string
  tags: string[]
  video_thumbnail_url?: string
  views_count: number
  likes_count: number
  created_at: string
  is_featured: boolean
  difficulty_level?: string
}

// Union type for unified prompt display
type UnifiedPrompt = (Prompt & { type: 'regular' }) | (TimelinePrompt & { type: 'timeline' }) | (ExplodedBuildPrompt & { type: 'exploded' })

// Community Prompt Card Component
function CommunityPromptCard({ prompt }: { prompt: CommunityPrompt }) {
  const router = useRouter()
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="group cursor-pointer" onClick={() => router.push(`/dashboard/community/${prompt.id}`)}>
      <div className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-gray-200 rounded-lg bg-white">
        {/* Video Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
          {prompt.video_thumbnail_url ? (
            <img
              src={prompt.video_thumbnail_url}
              alt={prompt.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Users className="w-12 h-12 text-blue-400" />
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-blue-100 text-blue-800 border-0">
              {prompt.prompt_category}
            </Badge>
          </div>

          {/* Featured Badge */}
          {prompt.is_featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-yellow-100 text-yellow-800 border-0">
                Featured
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {prompt.title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {prompt.clean_description || prompt.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {(() => {
              const displayTags = prompt.extracted_tags && prompt.extracted_tags.length > 0 
                ? prompt.extracted_tags 
                : prompt.tags
              return (
                <>
                  {displayTags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {displayTags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{displayTags.length - 3}
                    </Badge>
                  )}
                </>
              )
            })()}
          </div>

          {/* Creator & Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{prompt.creator_name}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span>👁️</span>
                <span>{prompt.views_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>❤️</span>
                <span>{prompt.likes_count}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>{formatDate(prompt.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ExploreLibrary() {
  const { features, refreshSubscription, subscription } = useAuth()
  const supabase = createClientComponentClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  const [timelineFilter, setTimelineFilter] = useState<'all' | 'with-timeline' | 'without-timeline' | 'special' | 'community'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<UnifiedPrompt | null>(null)
  const [sideSheetOpen, setSideSheetOpen] = useState(false)
  
  // Separate state for regular and timeline prompts
  const [regularPrompts, setRegularPrompts] = useState<Prompt[]>([])
  const [timelinePrompts, setTimelinePrompts] = useState<TimelinePrompt[]>([])
  const [explodedPrompts, setExplodedPrompts] = useState<ExplodedBuildPrompt[]>([])
  const [communityPrompts, setCommunityPrompts] = useState<CommunityPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [totalDatabaseCount, setTotalDatabaseCount] = useState(600) // Updated to 600 total prompts
  
  // Categories from all types
  const [categories, setCategories] = useState<string[]>(fallbackCategories)
  const [communityCategories, setCommunityCategories] = useState<string[]>([])
  
  // Timeline-specific categories
  const [timelineCategories, setTimelineCategories] = useState<string[]>(fallbackTimelineCategories)

  // Remove initial localStorage loading
  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 2
    const retryDelay = 2000 // 2 seconds
    
    // Set a shorter timeout to prevent long loading states
    const loadTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 15000) // 15 second timeout

    async function loadData(retry = false) {
      try {
        if (!mounted) return
        setLoading(true)
        
        // Helper function to fetch with timeout
        const fetchWithTimeout = async <T,>(promiseFn: () => Promise<T>, timeoutMs = 10000, fallbackValue: T): Promise<T> => {
          try {
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs/1000} seconds`)), timeoutMs)
            })
            return await Promise.race([promiseFn(), timeoutPromise]) as T
          } catch (error: any) {
            return fallbackValue
          }
        }
        
        // Function to load community prompts
        const loadCommunityPrompts = async (): Promise<CommunityPrompt[]> => {
          try {
            const { data, error } = await supabase
              .from('community_prompts')
              .select(`
                id,
                title,
                description,
                full_prompt_text,
                veo3_prompt,
                clean_description,
                extracted_tags,
                prompt_category,
                creator_name,
                creator_profile_url,
                tags,
                video_thumbnail_url,
                views_count,
                likes_count,
                created_at,
                is_featured,
                difficulty_level
              `)
              .eq('is_public', true)
              .eq('status', 'active')
              .order('is_featured', { ascending: false })
              .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
          } catch (error) {
            console.error('Error loading community prompts:', error)
            return []
          }
        }

        // Fetch all types of prompts and their metadata in parallel
        const [
          fetchedRegularPrompts,
          fetchedTimelinePrompts,
          fetchedExplodedPrompts,
          fetchedCommunityPrompts,
          fetchedCategories,
          fetchedTimelineCategories
        ] = await Promise.all([
          fetchWithTimeout(() => getAllPromptsClient(), 10000, []),
          fetchWithTimeout(() => getAllTimelinePromptsClient(), 10000, []),
          fetchWithTimeout(() => getAllExplodedPromptsClient(), 10000, []),
          fetchWithTimeout(() => loadCommunityPrompts(), 10000, []),
          fetchWithTimeout(() => getUniqueCategories(), 8000, fallbackCategories),
          fetchWithTimeout(() => getUniqueTimelineCategories(), 8000, fallbackTimelineCategories)
        ])
        
        if (!mounted) return

        // Check if we got any data
        const hasData = fetchedRegularPrompts.length > 0 || fetchedTimelinePrompts.length > 0 || fetchedExplodedPrompts.length > 0
        
        if (hasData) {
          // Update state with fetched data
          setRegularPrompts(fetchedRegularPrompts)
          setTimelinePrompts(fetchedTimelinePrompts)
          setExplodedPrompts(fetchedExplodedPrompts)
        } else {
          // If we still don't have data and have retries left, try again
          if ((!regularPrompts.length || !timelinePrompts.length || !explodedPrompts.length) && retry && retryCount < maxRetries) {
            retryCount++
            setTimeout(() => loadData(true), retryDelay)
            return
          }
        }
        
        // Always set community prompts (they're free to view)
        setCommunityPrompts(fetchedCommunityPrompts)
        
        // Extract community categories
        const communityCategories = Array.from(new Set(
          fetchedCommunityPrompts
            .map(prompt => prompt.prompt_category)
            .filter(Boolean)
        )).sort()
        setCommunityCategories(communityCategories)
        
        // Set timeline-specific categories
        setTimelineCategories(fetchedTimelineCategories.length > 0 ? fetchedTimelineCategories : fallbackTimelineCategories)
        
        // Combine categories for "All" tab
        const allCategories = Array.from(new Set([
          ...fetchedCategories,
          ...fetchedTimelineCategories,
          ...communityCategories,
          'Exploaded Build'
        ])).filter(Boolean).sort()
        
        setCategories(allCategories.length > 0 ? allCategories : fallbackCategories)
        
        setLoading(false)
      } catch (error) {
        // If we have retries left, try again
        if (retry && retryCount < maxRetries) {
          retryCount++
          setTimeout(() => loadData(true), retryDelay)
          return
        }
        
        setLoading(false)
      }
    }

    loadData(true) // Start with retry enabled

    return () => {
      mounted = false
      clearTimeout(loadTimeout)
    }
  }, [])

  // Convert prompts to unified format and filter based on current tab
  const getDisplayPrompts = (): { prompts: UnifiedPrompt[], totalCount: number, limitedCount: number } => {
    // Filter prompts based on search and filters
    const filteredRegularPrompts = regularPrompts
      .filter(prompt => {
        const matchesSearch = !searchQuery || 
          prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
      })
      .map(prompt => ({ ...prompt, type: 'regular' as const }));
    
    const filteredTimelinePrompts = timelinePrompts
      .filter(prompt => {
        const matchesSearch = !searchQuery || 
          prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
      })
      .map(prompt => ({ ...prompt, type: 'timeline' as const }));

    const filteredExplodedPrompts = explodedPrompts
      .filter(prompt => {
        const matchesSearch = !searchQuery || 
          prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .map(prompt => ({ ...prompt, type: 'exploded' as const }));

    // Filter community prompts
    const filteredCommunityPrompts = communityPrompts
      .filter(prompt => {
        const matchesSearch = !searchQuery || 
          prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (prompt.clean_description || prompt.description).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || prompt.prompt_category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    
    // Combine and filter based on timeline filter
    let combinedPrompts: UnifiedPrompt[] = [];
    
    if (timelineFilter === 'all') {
      combinedPrompts = [...filteredRegularPrompts, ...filteredTimelinePrompts, ...filteredExplodedPrompts];
    } else if (timelineFilter === 'with-timeline') {
      combinedPrompts = [...filteredTimelinePrompts];
    } else if (timelineFilter === 'without-timeline') {
      combinedPrompts = [...filteredRegularPrompts];
    } else if (timelineFilter === 'special') {
      combinedPrompts = [...filteredExplodedPrompts];
    } else if (timelineFilter === 'community') {
      // For community prompts, we don't need to convert to UnifiedPrompt format
      // since they'll be handled separately in the display logic
      return {
        prompts: [], // We'll handle community prompts separately
        totalCount: filteredCommunityPrompts.length,
        limitedCount: filteredCommunityPrompts.length
      };
    }
    
    // Get IDs of free viewable prompts
    const freeRegularPromptIds = FREE_VIEWABLE_REGULAR_PROMPTS;
    const freeTimelinePromptIds = FREE_VIEWABLE_TIMELINE_PROMPTS;
    const freeExplodedPromptIds = FREE_VIEWABLE_EXPLODED_PROMPTS;
    
    // Use the appropriate free prompt IDs based on the current tab
    let relevantFreePromptIds: string[] = [];
    if (timelineFilter === 'all') {
      relevantFreePromptIds = [...freeRegularPromptIds, ...freeTimelinePromptIds, ...freeExplodedPromptIds];
    } else if (timelineFilter === 'with-timeline') {
      relevantFreePromptIds = [...freeTimelinePromptIds];
    } else if (timelineFilter === 'without-timeline') {
      relevantFreePromptIds = [...freeRegularPromptIds];
    } else if (timelineFilter === 'special') {
      relevantFreePromptIds = [...freeExplodedPromptIds];
    }
    
    // Sort prompts to show free viewable prompts first
    combinedPrompts.sort((a, b) => {
      // First check if either prompt is in the free viewable list
      const aIsFree = relevantFreePromptIds.includes(a.id);
      const bIsFree = relevantFreePromptIds.includes(b.id);
      
      if (aIsFree && !bIsFree) return -1; // a is free, b is not, so a comes first
      if (!aIsFree && bIsFree) return 1;  // b is free, a is not, so b comes first
      
      // If both are free or both are not free, sort by date (newest first)
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
    
    const totalCount = combinedPrompts.length;
    let limitedCount = totalCount;
    let displayPrompts = combinedPrompts;
    
    // We no longer limit the number of visible prompts
    // Free users can see all prompts, but can only view details for specific ones
    // The limitedCount is still used for the "upgrade to see all" message
    
    // Apply pagination to all prompts
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPrompts = displayPrompts.slice(startIndex, startIndex + itemsPerPage);
    
    return {
      prompts: paginatedPrompts,
      totalCount,
      limitedCount
    };
  };

  const { prompts: displayPrompts, totalCount, limitedCount } = getDisplayPrompts();
  
  // Get community prompts for display when community tab is selected
  const getCommunityDisplayPrompts = () => {
    const filteredCommunityPrompts = communityPrompts
      .filter(prompt => {
        const matchesSearch = !searchQuery || 
          prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (prompt.clean_description || prompt.description).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || prompt.prompt_category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
      
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCommunityPrompts.slice(startIndex, startIndex + itemsPerPage);
  };
  
  const communityDisplayPrompts = timelineFilter === 'community' ? getCommunityDisplayPrompts() : [];
  const finalDisplayPrompts = timelineFilter === 'community' ? [] : displayPrompts;
  const finalTotalCount = timelineFilter === 'community' ? 
    communityPrompts.filter(prompt => {
      const matchesSearch = !searchQuery || 
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prompt.clean_description || prompt.description).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || prompt.prompt_category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).length : totalCount;
  
  // Calculate total pages for pagination
  const totalPages = Math.ceil((timelineFilter === 'community' ? finalTotalCount : limitedCount) / itemsPerPage);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, timelineFilter])

  // Reset filters when switching tabs
  useEffect(() => {
    setSelectedCategory('')
  }, [timelineFilter])

  const handleViewPrompt = (prompt: UnifiedPrompt) => {
    setSelectedPrompt(prompt)
    setSideSheetOpen(true)
  }

  const handleCloseSideSheet = () => {
    setSideSheetOpen(false)
    // Delay clearing the prompt to allow animation to complete
    setTimeout(() => setSelectedPrompt(null), 300)
  }

  // Get contextual filters based on current tab
  const getContextualFilters = () => {
    switch (timelineFilter) {
      case 'without-timeline':
        // Regular prompts only
        return {
          categories: Array.from(new Set(regularPrompts.map(p => p.category).filter(Boolean))).sort()
        }
      case 'with-timeline':
        // Timeline prompts only
        return {
          categories: timelineCategories
        }
      case 'special':
        // Exploded prompts only
        return {
          categories: Array.from(new Set(explodedPrompts.map(p => p.category).filter(Boolean))).sort()
        }
      case 'community':
        // Community prompts only
        return {
          categories: communityCategories
        }
      default:
        // All prompts
        return {
          categories: categories
        }
    }
  }

  const contextualFilters = getContextualFilters()

  // Get featured prompt for "Prompt of the Day"
  const promptOfTheDay = finalDisplayPrompts.length > 0 ? 
    (finalDisplayPrompts.find(p => p.is_featured) || finalDisplayPrompts[0]) : null

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Skeleton Loading UI */}
        <div className="mb-8">
          <div className="flex space-x-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-32 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>
        </div>
        
        <div className="space-y-6 mb-8">
          <div className="h-12 w-full max-w-2xl bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="h-40 w-full bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
        
        <div className="h-16 w-full bg-gray-200 rounded-xl animate-pulse mb-6"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setTimelineFilter('all')}
            className={`px-6 py-2 rounded-full transition-colors ${
              timelineFilter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Prompts ({regularPrompts.length + timelinePrompts.length + explodedPrompts.length})
          </button>
          <button
            onClick={() => setTimelineFilter('with-timeline')}
            className={`px-6 py-2 rounded-full transition-colors ${
              timelineFilter === 'with-timeline'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            With Timeline ({timelinePrompts.length})
          </button>
          <button
            onClick={() => setTimelineFilter('without-timeline')}
            className={`px-6 py-2 rounded-full transition-colors ${
              timelineFilter === 'without-timeline'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Without Timeline ({regularPrompts.length})
          </button>
          <button
            onClick={() => setTimelineFilter('special')}
            className={`px-6 py-2 rounded-full transition-colors ${
              timelineFilter === 'special'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Special (Exploaded Build) ({explodedPrompts.length})
          </button>
          <button
            onClick={() => setTimelineFilter('community')}
            className={`px-6 py-2 rounded-full transition-colors flex items-center gap-2 ${
              timelineFilter === 'community'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Community ({communityPrompts.length})
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
              {selectedCategory && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  1 active
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
                {contextualFilters.categories.map(category => (
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


            </div>
          )}
        </div>
      </div>

      {/* Results Count and Page Size Control */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 border border-gray-200">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{displayPrompts.length}</span> of <span className="font-medium text-gray-900">{totalCount}</span> prompts
          {!features.canViewAllPrompts && subscription?.plan !== 'pro' && (
            <span className="text-gray-500 ml-2">
              (Free users can only view details for 4 specific prompts)
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

      {/* FluxFrame Ad - Before Prompt Grid */}
      <div className="mb-8">
        <FluxFrameInlineAd />
      </div>

      {/* Prompt Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timelineFilter === 'community' ? (
          // Render community prompts with their own card format
          communityDisplayPrompts.map((prompt) => (
            <CommunityPromptCard 
              key={`community-${prompt.id}`} 
              prompt={prompt}
            />
          ))
        ) : (
          // Render regular prompts
          finalDisplayPrompts.map((prompt) => (
            <UnifiedPromptCard 
              key={`${prompt.type}-${prompt.id}`} 
              prompt={prompt}
              onViewPrompt={handleViewPrompt}
            />
          ))
        )}
      </div>

      {/* Empty State */}
      {(timelineFilter === 'community' ? communityDisplayPrompts.length === 0 : finalDisplayPrompts.length === 0) && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-medium text-gray-900 mb-2">No prompts found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search query
          </p>
          <Button 
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('')
              setTimelineFilter('all')
            }}
          >
            Reset Filters
          </Button>
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
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              // Show first 3, last 3, and current page with neighbors
              if (totalPages <= 7) {
                return i + 1;
              }
              
              if (i === 0) return 1; // First page
              if (i === 6) return totalPages; // Last page
              
              if (currentPage <= 3) {
                // Near beginning: show 1-5 ... lastPage
                return i + 1;
              }
              
              if (currentPage >= totalPages - 2) {
                // Near end: show 1 ... lastPage-4 to lastPage
                return totalPages - 6 + i;
              }
              
              // Middle: show 1 ... currentPage-1, currentPage, currentPage+1 ... lastPage
              if (i === 1) return '...';
              if (i === 5) return '...';
              
              return currentPage + i - 3;
            }).map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2">...</span>
              ) : (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(Number(page))}
                  className={`w-10 h-10 p-0 ${
                    currentPage === page 
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                      : "hover:bg-gray-100"
                  }`}
                >
                  {page}
                </Button>
              )
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-full px-4"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Paywall for free users only - hide for pro users */}
      {!features.canViewAllPrompts && subscription?.plan !== 'pro' && (
        <div className="mt-8 max-w-3xl mx-auto">
          <Paywall 
            title="Unlock All Prompts"
            description={`You can browse all ${totalDatabaseCount} prompts, but only view details for 4 specific prompts. Upgrade to Pro to view details for all prompts.`}
            feature="Full prompt access"
          />
        </div>
      )}

      {/* Side Sheet for Prompt Details */}
      <PromptSideSheet 
        open={sideSheetOpen}
        onClose={handleCloseSideSheet}
        prompt={selectedPrompt}
      />
    </div>
  )
} 