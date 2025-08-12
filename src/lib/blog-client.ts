import { BlogPost, BlogListResponse, BlogFilters } from '@/types/blog'
import { SAMPLE_BLOG_POSTS } from '@/data/blog-posts'

class BlogClient {
  // In a real app, this would connect to your CMS or database
  private posts: BlogPost[] = [...SAMPLE_BLOG_POSTS]

  async getAllPosts(): Promise<BlogPost[]> {
    return this.posts.sort((a, b) => 
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    return this.posts.find(post => post.slug === slug) || null
  }

  async getPosts(filters: BlogFilters = {}, page = 1, perPage = 10): Promise<BlogListResponse> {
    let filteredPosts = [...this.posts]

    // Apply filters
    if (filters.category) {
      filteredPosts = filteredPosts.filter(post => post.category === filters.category)
    }

    if (filters.tag) {
      filteredPosts = filteredPosts.filter(post => post.tags.includes(filters.tag!))
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    if (filters.featured) {
      filteredPosts = filteredPosts.filter(post => post.is_featured)
    }

    // Sort by date
    filteredPosts.sort((a, b) => 
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )

    // Pagination
    const total = filteredPosts.length
    const totalPages = Math.ceil(total / perPage)
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex)

    return {
      posts: paginatedPosts,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages
    }
  }

  async getFeaturedPosts(): Promise<BlogPost[]> {
    return this.posts
      .filter(post => post.is_featured)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
  }

  async getRelatedPosts(postId: string, limit = 3): Promise<BlogPost[]> {
    const currentPost = this.posts.find(p => p.id === postId)
    if (!currentPost) return []

    return this.posts
      .filter(post => 
        post.id !== postId && (
          post.category === currentPost.category ||
          post.tags.some(tag => currentPost.tags.includes(tag))
        )
      )
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, limit)
  }

  // Method to add new blog posts (for ingestion)
  async addPost(post: Omit<BlogPost, 'id'>): Promise<BlogPost> {
    const newPost: BlogPost = {
      ...post,
      id: Date.now().toString(), // Simple ID generation
    }
    
    this.posts.unshift(newPost)
    return newPost
  }

  // Method to update existing posts
  async updatePost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const index = this.posts.findIndex(post => post.id === id)
    if (index === -1) return null

    this.posts[index] = { ...this.posts[index], ...updates }
    return this.posts[index]
  }

  // Method to delete posts
  async deletePost(id: string): Promise<boolean> {
    const index = this.posts.findIndex(post => post.id === id)
    if (index === -1) return false

    this.posts.splice(index, 1)
    return true
  }
}

export const blogClient = new BlogClient() 