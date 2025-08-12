import { BlogPost } from '@/types/blog'
import { Calendar, Clock, User, ArrowLeft, Share2, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogCTA } from './blog-cta'

interface BlogArticleProps {
  post: BlogPost
}

export function BlogArticle({ post }: BlogArticleProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <article className="bg-white">
      {/* Hero Section */}
      <div className="relative">
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link 
            href="/insights"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:text-gray-900 transition-all duration-200 hover:bg-white shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Insights</span>
          </Link>
        </div>

        {/* Featured Image */}
        <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Article Header Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="max-w-4xl mx-auto">
              {/* Category Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${getCategoryColor(post.category)} bg-opacity-90`}>
                  {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                </span>
              </div>
              
              {/* Title */}
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                {post.title}
              </h1>
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{formatDate(post.published_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{post.read_time} min read</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-gray-200">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-full transition-all duration-200 ${
                isBookmarked 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none">
          {/* Excerpt */}
          <div className="text-xl text-gray-600 leading-relaxed mb-8 p-6 bg-gray-50 rounded-xl border-l-4 border-blue-500">
            {post.excerpt}
          </div>
          
          {/* Content */}
          <div className="prose prose-lg prose-gray max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }: any) => (
                  <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-6 first:mt-0">{children}</h1>
                ),
                h2: ({ children }: any) => (
                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{children}</h2>
                ),
                h3: ({ children }: any) => (
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{children}</h3>
                ),
                p: ({ children }: any) => (
                  <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
                ),
                ul: ({ children }: any) => (
                  <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">{children}</ul>
                ),
                ol: ({ children }: any) => (
                  <ol className="list-decimal list-inside space-y-2 mb-6 text-gray-700">{children}</ol>
                ),
                li: ({ children }: any) => (
                  <li className="text-gray-700">{children}</li>
                ),
                blockquote: ({ children }: any) => (
                  <blockquote className="border-l-4 border-blue-500 pl-6 py-2 mb-6 bg-blue-50 rounded-r-lg">
                    <div className="text-gray-700 italic">{children}</div>
                  </blockquote>
                ),
                code: ({ inline, children, ...props }: any) => {
                  if (inline) {
                    return (
                      <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    )
                  }
                  return (
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                      <pre className="text-sm">
                        <code {...props}>{children}</code>
                      </pre>
                    </div>
                  )
                },
                strong: ({ children }: any) => (
                  <strong className="font-bold text-gray-900">{children}</strong>
                ),
                em: ({ children }: any) => (
                  <em className="italic text-gray-700">{children}</em>
                ),
                hr: () => (
                  <hr className="border-t border-gray-300 my-8" />
                ),
                table: ({ children }: any) => (
                  <div className="overflow-x-auto mb-8 rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 bg-white">{children}</table>
                  </div>
                ),
                thead: ({ children }: any) => (
                  <thead className="bg-gray-50">{children}</thead>
                ),
                tbody: ({ children }: any) => (
                  <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
                ),
                tr: ({ children }: any) => (
                  <tr className="hover:bg-gray-50">{children}</tr>
                ),
                th: ({ children }: any) => (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    {children}
                  </th>
                ),
                td: ({ children }: any) => (
                  <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-normal">
                    {children}
                  </td>
                ),
                a: ({ href, children }: any) => (
                  <a 
                    href={href} 
                    className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                    target={href?.startsWith('http') ? '_blank' : '_self'}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* CTA Section */}
        <BlogCTA />
      </div>
    </article>
  )
} 