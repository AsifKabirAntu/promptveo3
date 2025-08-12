#!/usr/bin/env ts-node

import * as fs from 'fs'
import * as path from 'path'
import { BlogPost } from '../src/types/blog'

interface BlogPostInput {
  title: string
  slug?: string
  excerpt: string
  content: string
  author: {
    name: string
    avatar?: string
    bio?: string
  }
  featured_image: string
  category: string
  tags: string[]
  is_featured?: boolean
  meta_description?: string
  meta_keywords?: string[]
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

function createBlogPost(input: BlogPostInput): BlogPost {
  const now = new Date().toISOString()
  
  return {
    id: Date.now().toString(),
    title: input.title,
    slug: input.slug || generateSlug(input.title),
    excerpt: input.excerpt,
    content: input.content,
    author: input.author,
    featured_image: input.featured_image,
    category: input.category,
    tags: input.tags,
    published_at: now,
    updated_at: now,
    read_time: estimateReadTime(input.content),
    is_featured: input.is_featured || false,
    meta_description: input.meta_description,
    meta_keywords: input.meta_keywords
  }
}

async function ingestBlogPost(inputFile: string) {
  try {
    const inputPath = path.resolve(inputFile)
    
    if (!fs.existsSync(inputPath)) {
      console.error(`File not found: ${inputPath}`)
      process.exit(1)
    }

    const fileContent = fs.readFileSync(inputPath, 'utf-8')
    let input: BlogPostInput

    if (inputPath.endsWith('.json')) {
      input = JSON.parse(fileContent)
    } else if (inputPath.endsWith('.md')) {
      // Parse markdown with frontmatter
      const parts = fileContent.split('---')
      if (parts.length < 3) {
        console.error('Invalid markdown format. Expected frontmatter between ---')
        process.exit(1)
      }
      
      const frontmatter = parts[1].trim()
      const content = parts.slice(2).join('---').trim()
      
      // Simple YAML parsing (for demo purposes)
      const metadata: any = {}
      frontmatter.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim()
          if (value.startsWith('[') && value.endsWith(']')) {
            // Parse array
            metadata[key.trim()] = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''))
          } else {
            metadata[key.trim()] = value.replace(/['"]/g, '')
          }
        }
      })
      
      input = {
        ...metadata,
        content,
        author: metadata.author || { name: 'Anonymous' },
        tags: metadata.tags || []
      }
    } else {
      console.error('Unsupported file format. Use .json or .md files')
      process.exit(1)
    }

    const blogPost = createBlogPost(input)
    
    // Add to the blog posts data file
    const dataFilePath = path.resolve('./src/data/blog-posts.ts')
    const dataFileContent = fs.readFileSync(dataFilePath, 'utf-8')
    
    // Insert the new post at the beginning of the SAMPLE_BLOG_POSTS array
    const newPostString = JSON.stringify(blogPost, null, 2)
      .split('\n')
      .map(line => `  ${line}`)
      .join('\n')
    
    const updatedContent = dataFileContent.replace(
      'export const SAMPLE_BLOG_POSTS: BlogPost[] = [',
      `export const SAMPLE_BLOG_POSTS: BlogPost[] = [\n${newPostString},`
    )
    
    fs.writeFileSync(dataFilePath, updatedContent)
    
    console.log('✅ Blog post ingested successfully!')
    console.log(`   Title: ${blogPost.title}`)
    console.log(`   Slug: ${blogPost.slug}`)
    console.log(`   Category: ${blogPost.category}`)
    console.log(`   Read time: ${blogPost.read_time} minutes`)
    console.log(`   URL: /insights/${blogPost.slug}`)
    
  } catch (error) {
    console.error('❌ Error ingesting blog post:', error)
    process.exit(1)
  }
}

// CLI usage
if (require.main === module) {
  const inputFile = process.argv[2]
  
  if (!inputFile) {
    console.log('Usage: npm run ingest-blog <file.json|file.md>')
    console.log('')
    console.log('Examples:')
    console.log('  npm run ingest-blog ./content/new-post.json')
    console.log('  npm run ingest-blog ./content/new-post.md')
    process.exit(1)
  }
  
  ingestBlogPost(inputFile)
}

export { ingestBlogPost, createBlogPost } 