import { BlogPost } from '@/types/blog'
import { BlogCard } from './blog-card'

interface RelatedArticlesProps {
  posts: BlogPost[]
}

export function RelatedArticles({ posts }: RelatedArticlesProps) {
  if (posts.length === 0) return null

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Continue Reading
          </h2>
          <p className="text-lg text-gray-600">
            Discover more insights and expert tips
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} size="small" />
          ))}
        </div>
      </div>
    </section>
  )
} 