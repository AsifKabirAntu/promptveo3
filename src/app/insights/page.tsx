'use client'

import { useState, useMemo } from 'react'
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BlogCard } from "@/components/blog/blog-card"
import { BlogFilters } from "@/components/blog/blog-filters"
import { BlogHero } from "@/components/blog/blog-hero"
import { SAMPLE_BLOG_POSTS, BLOG_CATEGORIES } from '@/data/blog-posts'
import { BlogFilters as BlogFiltersType } from '@/types/blog'

export default function InsightsPage() {
  const [filters, setFilters] = useState<BlogFiltersType>({})
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPosts = useMemo(() => {
    let posts = [...SAMPLE_BLOG_POSTS]

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      posts = posts.filter(post => post.category === filters.category)
    }

    // Filter by featured
    if (filters.featured) {
      posts = posts.filter(post => post.is_featured)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term) ||
        post.tags.some(tag => tag.toLowerCase().includes(term))
      )
    }

    // Filter by tag
    if (filters.tag) {
      posts = posts.filter(post => post.tags.includes(filters.tag!))
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())

    return posts
  }, [filters, searchTerm])

  const featuredPosts = SAMPLE_BLOG_POSTS.filter(post => post.is_featured)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <BlogHero />
        
        {/* Featured Articles Section */}
        {featuredPosts.length > 0 && (
          <section className="py-16 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  Featured <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Insights</span>
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Our most popular and impactful articles
                </p>
              </div>
              
              <div className="grid gap-8 lg:grid-cols-2">
                {featuredPosts.map((post, index) => (
                  <BlogCard 
                    key={post.id} 
                    post={post} 
                    featured={true}
                    size={index === 0 ? 'large' : 'medium'}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Articles Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar with Filters */}
              <aside className="lg:w-80 flex-shrink-0">
                <BlogFilters 
                  categories={BLOG_CATEGORIES}
                  filters={filters}
                  onFiltersChange={setFilters}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </aside>

              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    All Insights
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'})
                    </span>
                  </h2>
                </div>

                {filteredPosts.length > 0 ? (
                  <div className="grid gap-8 md:grid-cols-2">
                    {filteredPosts.map((post) => (
                      <BlogCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="max-w-sm mx-auto">
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                      <p className="text-gray-500">
                        Try adjusting your filters or search terms to find what you're looking for.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
} 