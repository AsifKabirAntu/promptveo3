import Link from 'next/link'
import { BlogPost } from '@/types/blog'
import { Calendar, Clock, User, ArrowRight } from 'lucide-react'

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function BlogCard({ post, featured = false, size = 'medium' }: BlogCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      tutorials: 'bg-blue-100 text-blue-800',
      news: 'bg-green-100 text-green-800',
      tips: 'bg-purple-100 text-purple-800',
      showcase: 'bg-orange-100 text-orange-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const cardClasses = {
    small: 'group cursor-pointer',
    medium: 'group cursor-pointer',
    large: 'group cursor-pointer lg:col-span-2'
  }

  const imageClasses = {
    small: 'aspect-[16/9] w-full object-cover',
    medium: 'aspect-[16/9] w-full object-cover',
    large: 'aspect-[21/9] w-full object-cover'
  }

  return (
    <Link href={`/insights/${post.slug}`}>
      <article className={`${cardClasses[size]} transition-all duration-300`}>
        <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 hover:border-blue-400 hover:border-2 transition-all duration-300">
          {/* Image */}
          <div className="relative overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className={`${imageClasses[size]} group-hover:scale-105 transition-transform duration-700`}
            />
            
            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getCategoryColor(post.category)}`}>
                {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
              </span>
            </div>
            
            {/* Featured Badge */}
            {featured && (
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 text-xs font-medium text-white">
                  ⭐ Featured
                </span>
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          
          {/* Content */}
          <div className={`p-6 ${size === 'large' ? 'lg:p-8' : ''}`}>
            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.published_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.read_time} min read</span>
              </div>
            </div>
            
            {/* Title */}
            <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 ${
              size === 'large' ? 'text-2xl lg:text-3xl mb-4' : 'text-xl mb-3'
            }`}>
              {post.title}
            </h3>
            
            {/* Excerpt */}
            <p className={`text-gray-600 leading-relaxed ${
              size === 'large' ? 'text-lg mb-6' : 'text-base mb-4'
            }`}>
              {post.excerpt}
            </p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                  +{post.tags.length - 3} more
                </span>
              )}
            </div>
            
            {/* Read More */}
            <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
              <span className="mr-2">Read more</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
} 