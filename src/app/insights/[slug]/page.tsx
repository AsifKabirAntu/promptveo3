'use client'

import { useParams } from 'next/navigation'
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BlogArticle } from "@/components/blog/blog-article"
import { RelatedArticles } from "@/components/blog/related-articles"
import { SAMPLE_BLOG_POSTS } from '@/data/blog-posts'
import { notFound } from 'next/navigation'

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string

  const post = SAMPLE_BLOG_POSTS.find(p => p.slug === slug)
  
  if (!post) {
    notFound()
  }

  const relatedPosts = SAMPLE_BLOG_POSTS
    .filter(p => p.id !== post.id && (
      p.category === post.category || 
      p.tags.some(tag => post.tags.includes(tag))
    ))
    .slice(0, 3)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <BlogArticle post={post} />
        {relatedPosts.length > 0 && (
          <RelatedArticles posts={relatedPosts} />
        )}
      </main>
      <Footer />
    </>
  )
} 