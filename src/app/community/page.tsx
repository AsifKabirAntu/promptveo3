'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Play, Heart, Eye, User, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BlogCTA } from '@/components/blog/blog-cta'
import { FluxFrameInlineAd } from '@/components/ads/FluxFrameInlineAd'

interface CommunityPrompt {
  id: string
  title: string
  description: string
  full_prompt_text: string
  veo3_prompt?: string
  clean_description?: string
  extracted_tags?: string[]
  prompt_category: string // Only use the AI-generated category
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

export default function CommunityDirectoryPage() {
  const [prompts, setPrompts] = useState<CommunityPrompt[]>([])
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'featured'>('featured')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [likingPrompts, setLikingPrompts] = useState<Set<string>>(new Set())
  const [likedPrompts, setLikedPrompts] = useState<Set<string>>(new Set())
  const itemsPerPage = 24

  // Load liked prompts from localStorage on mount
  useEffect(() => {
    const savedLikes = localStorage.getItem('likedPrompts')
    if (savedLikes) {
      try {
        const likes = JSON.parse(savedLikes)
        setLikedPrompts(new Set(likes))
      } catch (error) {
        console.error('Error loading liked prompts:', error)
      }
    }
  }, [])

  // Save liked prompts to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('likedPrompts', JSON.stringify(Array.from(likedPrompts)))
  }, [likedPrompts])

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadPrompts()
    loadCategories()
  }, [selectedCategory, sortBy, currentPage])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      
      // Calculate pagination offset
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      
      let query = supabase
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

      // Create a separate query for counting total results
      let countQuery = supabase
        .from('community_prompts')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true)
        .eq('status', 'active')

      if (selectedCategory) {
        query = query.eq('prompt_category', selectedCategory)
        countQuery = countQuery.eq('prompt_category', selectedCategory)
      }

      if (searchQuery) {
        query = query.textSearch('search_vector', searchQuery)
        countQuery = countQuery.textSearch('search_vector', searchQuery)
      }

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'popular') {
        query = query.order('views_count', { ascending: false })
      } else {
        // Featured first, then by created_at
        query = query.order('is_featured', { ascending: false })
                     .order('created_at', { ascending: false })
      }

      // Apply pagination
      query = query.range(from, to)

      // Execute both queries
      const [{ data, error }, { count, error: countError }] = await Promise.all([
        query,
        countQuery
      ])

      if (error) throw error
      if (countError) throw countError

      setPrompts(data || [])
      setTotalCount(count || 0)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
      
    } catch (error) {
      console.error('Error loading prompts:', error)
      setPrompts([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('community_prompts')
        .select('prompt_category')
        .eq('is_public', true)
        .eq('status', 'active')
        .not('prompt_category', 'is', null) // Only get records with AI-generated categories
      
      if (error) {
        console.error('Error loading categories:', error)
        return
      }

      // Count categories manually
      const categoryCount: Record<string, number> = {}
      data?.forEach(item => {
        if (item.prompt_category) {
          categoryCount[item.prompt_category] = (categoryCount[item.prompt_category] || 0) + 1
        }
      })

      const categoryList = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count) // Sort by count descending

      setCategories(categoryList || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page when searching
    loadPrompts()
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1) // Reset to first page when changing category
  }

  const handleSortChange = (sort: 'newest' | 'popular' | 'featured') => {
    setSortBy(sort)
    setCurrentPage(1) // Reset to first page when changing sort
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleQuickLike = async (promptId: string, event: React.MouseEvent) => {
    event.preventDefault() // Prevent navigation to detail page
    event.stopPropagation()
    
    if (likingPrompts.has(promptId)) return
    
    const isCurrentlyLiked = likedPrompts.has(promptId)
    
    try {
      setLikingPrompts(prev => new Set(prev).add(promptId))
      const action = isCurrentlyLiked ? 'unlike' : 'like'
      
      const response = await fetch(`/api/community/${promptId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update the local prompt data with new like count
        setPrompts(prev => prev.map(p => 
          p.id === promptId 
            ? { ...p, likes_count: data.likes_count }
            : p
        ))
        
        // Update liked state
        setLikedPrompts(prev => {
          const newSet = new Set(prev)
          if (isCurrentlyLiked) {
            newSet.delete(promptId)
          } else {
            newSet.add(promptId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Error handling like:', error)
    } finally {
      setLikingPrompts(prev => {
        const newSet = new Set(prev)
        newSet.delete(promptId)
        return newSet
      })
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section - Only show on page 1 */}
      {currentPage === 1 && (
        <section className="relative overflow-hidden py-20 sm:py-24 lg:py-32">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
          <div className="absolute inset-0 bg-grid-black/[0.02] bg-grid" />
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-sm font-medium text-blue-800 mb-6">
                <span className="mr-2">🎬</span>
                Community Video Prompts
              </div>
              
              {/* Main Heading */}
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                <span className="block">Discover</span>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  AI Video Prompts
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-700 sm:text-xl">
                Explore {totalCount} high-quality video prompts created by our community. 
                Find inspiration for your next AI video project.
              </p>
            </div>
          </div>
          
          {/* Custom CSS for blob animation */}
          <style jsx>{`
            @keyframes blob {
              0% {
                transform: translate(0px, 0px) scale(1);
              }
              33% {
                transform: translate(30px, -50px) scale(1.1);
              }
              66% {
                transform: translate(-20px, 20px) scale(0.9);
              }
              100% {
                transform: translate(0px, 0px) scale(1);
              }
            }
            .animate-blob {
              animation: blob 7s infinite;
            }
            .animation-delay-2000 {
              animation-delay: 2s;
            }
            .animation-delay-4000 {
              animation-delay: 4s;
            }
            .bg-grid {
              background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0);
              background-size: 20px 20px;
            }
          `}</style>
        </section>
      )}

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${currentPage === 1 ? 'pb-20' : 'py-8'}`}>
        <div>
          {/* Search and Filter Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                Search
              </Button>
            </div>
            
            {/* Results Count */}
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Community Prompts
              </h2>
              <p className="text-gray-600">
                {totalCount} prompt{totalCount !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Filters */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
                
                {/* Sort */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="featured">Featured First</option>
                    <option value="newest">Newest</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleCategoryChange('')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === ''
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => handleCategoryChange(category.name)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center ${
                          selectedCategory === category.name
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span>{category.name}</span>
                        <span className="text-xs text-gray-500">{category.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* FluxFrame Ad - Top of content */}
              <FluxFrameInlineAd />
              
              {/* Loading State */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                      <div className="aspect-video bg-gray-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-200 rounded w-16" />
                          <div className="h-6 bg-gray-200 rounded w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Prompts Grid */}
              {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prompts.map((prompt) => (
                    <Link
                      key={prompt.id}
                      href={`/community/${prompt.id}`}
                      className="group"
                    >
                      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-gray-200">
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
                              <Play className="w-12 h-12 text-blue-400" />
                            </div>
                          )}
                          
                          {/* Category Badge - AI Generated */}
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-blue-100 text-blue-800 border-0">
                              {prompt.prompt_category}
                            </Badge>
                          </div>

                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <div className="bg-white/90 rounded-full p-3">
                              <Play className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
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
                              <User className="w-3 h-3" />
                              {prompt.creator_profile_url ? (
                                <a 
                                  href={prompt.creator_profile_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                  onClick={(e) => e.stopPropagation()} // Prevent card click when clicking creator link
                                >
                                  {prompt.creator_name}
                                </a>
                              ) : (
                                <span>{prompt.creator_name}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{prompt.views_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart 
                                  className={`w-3 h-3 cursor-pointer ${likedPrompts.has(prompt.id) ? 'text-red-500' : 'text-gray-400'}`}
                                  onClick={(e) => handleQuickLike(prompt.id, e)}
                                />
                                <span>{prompt.likes_count}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(prompt.created_at)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {prompt.prompt_category}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && prompts.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No prompts found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('')
                      loadPrompts()
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {!loading && prompts.length > 0 && totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant={1 === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            className="w-10"
                          >
                            1
                          </Button>
                          {currentPage > 4 && <span className="px-2 text-gray-500">...</span>}
                        </>
                      )}

                      {/* Page range around current page */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        if (pageNum < 1 || pageNum > totalPages) return null;
                        if (currentPage > 3 && pageNum === 1) return null; // Already shown above
                        if (currentPage < totalPages - 2 && pageNum === totalPages) return null; // Will be shown below

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      {/* Last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="px-2 text-gray-500">...</span>}
                          <Button
                            variant={totalPages === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                            className="w-10"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Next Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Page Info */}
              {!loading && prompts.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} prompts
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <BlogCTA 
            primaryText="Explore Our Full Prompt Library"
            primaryHref="/dashboard"
            secondaryText="Join the Community"
            secondaryHref="/auth/signin"
          />
        </div>
      </div>
    </div>
    
    <Footer />
    </>
  )
} 