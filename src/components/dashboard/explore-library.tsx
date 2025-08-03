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
  const { features, refreshSubscription, subscription } = useAuth()
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

  // Refresh subscription and clear localStorage cache if needed
  useEffect(() => {
    // Check if subscription is pro but localStorage says free
    const checkAndRefreshSubscription = async () => {
      try {
        // Check localStorage subscription data
        const subKey = 'subscription_data';
        const storedSub = localStorage.getItem(subKey);
        
        if (storedSub) {
          const { plan } = JSON.parse(storedSub);
          
          // If subscription is pro but localStorage says free, refresh
          if (subscription?.plan === 'pro' && plan !== 'pro') {
            console.log('Subscription mismatch detected, refreshing...');
            await refreshSubscription();
            
            // Clear localStorage cache to force fresh data load
            localStorage.removeItem('prompts_cache');
            localStorage.removeItem('timeline_prompts_cache');
            
            // Force reload the page to get fresh data
            window.location.reload();
          }
        }
      } catch (e) {
        console.error('Error checking subscription:', e);
      }
    };
    
    if (subscription) {
      checkAndRefreshSubscription();
    }
  }, [subscription, refreshSubscription]);

  // Try to load data from localStorage on mount
  useEffect(() => {
    try {
      // Try to get cached data from localStorage first
      const cachedRegularPrompts = localStorage.getItem('prompts_cache')
      const cachedTimelinePrompts = localStorage.getItem('timeline_prompts_cache')
      
      if (cachedRegularPrompts) {
        try {
          const parsed = JSON.parse(cachedRegularPrompts)
          if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
            console.log(`Initializing with ${parsed.data.length} prompts from localStorage`)
            setRegularPrompts(parsed.data)
          }
        } catch (e) {
          console.error('Error parsing cached regular prompts:', e)
        }
      }
      
      if (cachedTimelinePrompts) {
        try {
          const parsed = JSON.parse(cachedTimelinePrompts)
          if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
            console.log(`Initializing with ${parsed.data.length} timeline prompts from localStorage`)
            setTimelinePrompts(parsed.data)
          }
        } catch (e) {
          console.error('Error parsing cached timeline prompts:', e)
        }
      }
    } catch (e) {
      console.error('Error accessing localStorage on mount:', e)
    }
  }, [])

  // Load all data
  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 2
    const retryDelay = 2000 // 2 seconds
    
    // Set a shorter timeout to prevent long loading states
    const loadTimeout = setTimeout(() => {
      if (mounted) {
        console.log('⚠️ Data loading timed out, using fallback data')
        setLoading(false)
        
        // Don't set empty arrays here - use whatever data we have
        // If we have data in localStorage, the data will already be set by now
        if (regularPrompts.length === 0 && timelinePrompts.length === 0) {
          console.log('No data available, using hardcoded fallbacks')
          
          // Try to get data from localStorage as a last resort
          try {
            const cachedRegularPrompts = localStorage.getItem('prompts_cache')
            const cachedTimelinePrompts = localStorage.getItem('timeline_prompts_cache')
            
            if (cachedRegularPrompts) {
              try {
                const parsed = JSON.parse(cachedRegularPrompts)
                if (parsed.data && Array.isArray(parsed.data)) {
                  console.log(`Using ${parsed.data.length} prompts from localStorage`)
                  setRegularPrompts(parsed.data)
                }
              } catch (e) {
                console.error('Error parsing cached regular prompts:', e)
              }
            }
            
            if (cachedTimelinePrompts) {
              try {
                const parsed = JSON.parse(cachedTimelinePrompts)
                if (parsed.data && Array.isArray(parsed.data)) {
                  console.log(`Using ${parsed.data.length} timeline prompts from localStorage`)
                  setTimelinePrompts(parsed.data)
                }
              } catch (e) {
                console.error('Error parsing cached timeline prompts:', e)
              }
            }
          } catch (e) {
            console.error('Error accessing localStorage:', e)
          }
        }
      }
    }, 15000) // 15 second timeout (increased from 5)

    async function loadData(retry = false) {
      try {
        if (!mounted) return
        setLoading(true)
        
        console.log(`🔍 Loading prompt data...${retry ? ` (Retry ${retryCount}/${maxRetries})` : ''}`)
        
        // Helper function to fetch with timeout
        const fetchWithTimeout = async <T,>(promiseFn: () => Promise<T>, timeoutMs = 10000, fallbackValue: T): Promise<T> => {
          try {
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs/1000} seconds`)), timeoutMs)
            })
            return await Promise.race([promiseFn(), timeoutPromise]) as T
          } catch (error: any) {
            console.error(`Timeout or error: ${error.message}`)
            return fallbackValue
          }
        }
        
        // Fetch both types of prompts and their metadata in parallel
        const [
          fetchedRegularPrompts,
          fetchedTimelinePrompts,
          fetchedCategories,
          fetchedStyles,
          fetchedTimelineCategories,
          fetchedTimelineStyles
        ] = await Promise.all([
          fetchWithTimeout(() => getAllPromptsClient(), 10000, []),
          fetchWithTimeout(() => getAllTimelinePromptsClient(), 10000, []),
          fetchWithTimeout(() => getUniqueCategories(), 8000, fallbackCategories),
          fetchWithTimeout(() => getUniqueStyles(), 8000, fallbackStyles),
          fetchWithTimeout(() => getUniqueTimelineCategories(), 8000, fallbackTimelineCategories),
          fetchWithTimeout(() => getUniqueTimelineBaseStyles(), 8000, fallbackTimelineBaseStyles)
        ])
        
        if (!mounted) return

        // Check if we got any data
        const hasData = fetchedRegularPrompts.length > 0 || fetchedTimelinePrompts.length > 0
        
        if (hasData) {
          console.log('✅ Data loaded successfully')
          console.log('Regular prompts:', fetchedRegularPrompts.length)
          console.log('Timeline prompts:', fetchedTimelinePrompts.length)
          
          // Update state with fetched data
          setRegularPrompts(fetchedRegularPrompts)
          setTimelinePrompts(fetchedTimelinePrompts)
          
          // Store the data in localStorage for future use
          try {
            localStorage.setItem('prompts_cache_timestamp', Date.now().toString())
            localStorage.setItem('prompts_cache', JSON.stringify({
              data: fetchedRegularPrompts,
              timestamp: Date.now()
            }))
            localStorage.setItem('timeline_prompts_cache', JSON.stringify({
              data: fetchedTimelinePrompts,
              timestamp: Date.now()
            }))
          } catch (e) {
            console.error('Error storing data in localStorage:', e)
          }
        } else {
          console.log('⚠️ No data received from API')
          
          // Try to get data from localStorage
          try {
            const cachedRegularPrompts = localStorage.getItem('prompts_cache')
            const cachedTimelinePrompts = localStorage.getItem('timeline_prompts_cache')
            
            if (cachedRegularPrompts) {
              try {
                const parsed = JSON.parse(cachedRegularPrompts)
                if (parsed.data && Array.isArray(parsed.data)) {
                  console.log(`Using ${parsed.data.length} prompts from localStorage`)
                  setRegularPrompts(parsed.data)
                }
              } catch (e) {
                console.error('Error parsing cached regular prompts:', e)
              }
            }
            
            if (cachedTimelinePrompts) {
              try {
                const parsed = JSON.parse(cachedTimelinePrompts)
                if (parsed.data && Array.isArray(parsed.data)) {
                  console.log(`Using ${parsed.data.length} timeline prompts from localStorage`)
                  setTimelinePrompts(parsed.data)
                }
              } catch (e) {
                console.error('Error parsing cached timeline prompts:', e)
              }
            }
          } catch (e) {
            console.error('Error accessing localStorage:', e)
          }
          
          // If we still don't have data and have retries left, try again
          if ((!regularPrompts.length || !timelinePrompts.length) && retry && retryCount < maxRetries) {
            retryCount++
            console.log(`Retrying data load (${retryCount}/${maxRetries})...`)
            setTimeout(() => loadData(true), retryDelay)
            return
          }
        }
        
        // Combine categories and styles
        const allCategories = Array.from(new Set([
          ...fetchedCategories,
          ...fetchedTimelineCategories
        ])).filter(Boolean).sort()
        
        const allStyles = Array.from(new Set([
          ...fetchedStyles,
          ...fetchedTimelineStyles
        ])).filter(Boolean).sort()
        
        setCategories(allCategories.length > 0 ? allCategories : fallbackCategories)
        setStyles(allStyles.length > 0 ? allStyles : fallbackStyles)
        
        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        
        // Try to get data from localStorage as a fallback
        try {
          const cachedRegularPrompts = localStorage.getItem('prompts_cache')
          const cachedTimelinePrompts = localStorage.getItem('timeline_prompts_cache')
          
          if (cachedRegularPrompts) {
            try {
              const parsed = JSON.parse(cachedRegularPrompts)
              if (parsed.data && Array.isArray(parsed.data)) {
                console.log(`Using ${parsed.data.length} prompts from localStorage`)
                setRegularPrompts(parsed.data)
              }
            } catch (e) {
              console.error('Error parsing cached regular prompts:', e)
            }
          }
          
          if (cachedTimelinePrompts) {
            try {
              const parsed = JSON.parse(cachedTimelinePrompts)
              if (parsed.data && Array.isArray(parsed.data)) {
                console.log(`Using ${parsed.data.length} timeline prompts from localStorage`)
                setTimelinePrompts(parsed.data)
              }
            } catch (e) {
              console.error('Error parsing cached timeline prompts:', e)
            }
          }
        } catch (e) {
          console.error('Error accessing localStorage:', e)
        }
        
        // If we have retries left, try again
        if (retry && retryCount < maxRetries) {
          retryCount++
          console.log(`Retrying data load (${retryCount}/${maxRetries})...`)
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
        const matchesStyle = !selectedStyle || prompt.style === selectedStyle;
        
        return matchesSearch && matchesCategory && matchesStyle;
      })
      .map(prompt => ({ ...prompt, type: 'regular' as const }));
    
    const filteredTimelinePrompts = timelinePrompts
      .filter(prompt => {
        const matchesSearch = !searchQuery || 
          prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
        const matchesStyle = !selectedStyle || prompt.base_style === selectedStyle;
        
        return matchesSearch && matchesCategory && matchesStyle;
      })
      .map(prompt => ({ ...prompt, type: 'timeline' as const }));
    
    // Combine and filter based on timeline filter
    let combinedPrompts: UnifiedPrompt[] = [];
    
    if (timelineFilter === 'all') {
      combinedPrompts = [...filteredRegularPrompts, ...filteredTimelinePrompts];
    } else if (timelineFilter === 'with-timeline') {
      combinedPrompts = [...filteredTimelinePrompts];
    } else {
      combinedPrompts = [...filteredRegularPrompts];
    }
    
    // Sort by date (newest first)
    combinedPrompts.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
    
    const totalCount = combinedPrompts.length;
    let limitedCount = totalCount;
    let displayPrompts = combinedPrompts;
    
    // For free users, limit the total number of visible prompts
    if (!features.canViewAllPrompts) {
      limitedCount = Math.min(totalCount, features.maxVisiblePrompts);
      displayPrompts = combinedPrompts.slice(0, limitedCount);
    }
    
    // Apply pagination to the displayable prompts (either all for pro, or limited for free)
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPrompts = displayPrompts.slice(startIndex, startIndex + itemsPerPage);
    
    return {
      prompts: paginatedPrompts,
      totalCount,
      limitedCount
    };
  };

  const { prompts: displayPrompts, totalCount, limitedCount } = getDisplayPrompts();
  
  // Calculate total pages for pagination
  const totalPages = Math.ceil(limitedCount / itemsPerPage);
  
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
            All Prompts ({regularPrompts.length + timelinePrompts.length})
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

      {/* Empty State */}
      {displayPrompts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-medium text-gray-900 mb-2">No prompts found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search query
          </p>
          <Button 
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('')
              setSelectedStyle('')
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

      {/* Paywall for free users only */}
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

      {/* Side Sheet for Prompt Details */}
      <PromptSideSheet 
        open={sideSheetOpen}
        onClose={handleCloseSideSheet}
        prompt={selectedPrompt}
      />
    </div>
  )
} 