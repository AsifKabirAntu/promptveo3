export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author?: {
    name: string
    avatar?: string
    bio?: string
  }
  featured_image: string
  category: string
  tags: string[]
  published_at: string
  updated_at: string
  read_time: number // in minutes
  is_featured: boolean
  meta_description?: string
  meta_keywords?: string[]
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string
  color: string
}

export interface BlogListResponse {
  posts: BlogPost[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface BlogFilters {
  category?: string
  tag?: string
  search?: string
  featured?: boolean
} 