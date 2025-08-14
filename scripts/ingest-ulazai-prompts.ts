#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import { ScrapedPrompt, ScrapingResult } from './scrape-ulazai-prompts'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please set:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Map UlazAI categories to our standard categories
const categoryMapping: Record<string, string> = {
  '🎨 Abstract': 'Abstract',
  '⚡ Action': 'Action',
  '🏢 Architecture': 'Cinematic',
  '🎭 Behind the Scenes': 'Behind-the-Scenes',
  '🏢 Brand Marketing': 'Commercial',
  '💰 E-commerce Ads': 'Commercial',
  '🎓 Educational Content': 'Educational',
  '🏆 Esports': 'Sports',
  '👥 Facebook Videos': 'Social Media',
  '🧙 Fantasy': 'Fantasy',
  '💪 Fitness & Health': 'Lifestyle',
  '🍕 Food': 'Food & Culinary',
  '🎬 Game Trailers': 'Gaming',
  '🎮 Gaming Content': 'Gaming',
  '⭐ Gaming Reviews': 'Gaming',
  '📚 How-to Tutorials': 'Educational',
  '⭐ Influencer Content': 'Social Media',
  '📸 Instagram Reels': 'Social Media',
  '📱 Lifestyle Vlogs': 'Lifestyle',
  '💼 LinkedIn Professional': 'Professional',
  '😂 Memes & Comedy': 'Comedy',
  '🎶 Music & Dance': 'Music',
  '🌿 Nature': 'Nature',
  '👤 Portrait': 'Portrait',
  '🛍️ Product Showcase': 'Product Demo',
  '👻 Snapchat Stories': 'Social Media',
  '📡 Streaming Content': 'Entertainment',
  '🤖 Technology': 'Technology',
  '💬 Testimonials': 'Commercial',
  '🎵 TikTok Videos': 'Social Media',
  '📦 Unboxing Videos': 'Product Demo',
  '🔥 Viral Trends': 'Trending',
  '🐦 X (Twitter) Content': 'Social Media',
  '📺 YouTube Content': 'Social Media'
}

// Extract Veo 3 prompt structure from content
function parsePromptContent(content: string): {
  description: string
  style: string
  camera: string
  lighting: string
  environment: string
  elements: string[]
  motion: string
  ending: string
  keywords: string[]
} {
  const cleanContent = content.replace(/[\n\r]+/g, ' ').trim()
  
  // Default values
  let description = cleanContent
  let style = 'cinematic'
  let camera = 'medium shot'
  let lighting = 'natural lighting'
  let environment = 'outdoor setting'
  let elements: string[] = []
  let motion = 'smooth movement'
  let ending = 'fade out'
  let keywords: string[] = []

  // Try to extract structured information from the content
  const lowerContent = cleanContent.toLowerCase()

  // Extract camera angles/shots
  const cameraKeywords = ['close-up', 'wide shot', 'medium shot', 'overhead', 'aerial', 'pov', 'tracking shot', 'handheld', 'drone', 'crane shot']
  for (const cam of cameraKeywords) {
    if (lowerContent.includes(cam)) {
      camera = cam
      break
    }
  }

  // Extract lighting information
  const lightingKeywords = ['golden hour', 'natural light', 'studio lighting', 'dramatic lighting', 'soft lighting', 'harsh lighting', 'neon', 'sunset', 'daylight']
  for (const light of lightingKeywords) {
    if (lowerContent.includes(light)) {
      lighting = light
      break
    }
  }

  // Extract environment
  const environmentKeywords = ['indoor', 'outdoor', 'studio', 'office', 'street', 'nature', 'beach', 'forest', 'urban', 'city', 'home', 'kitchen']
  for (const env of environmentKeywords) {
    if (lowerContent.includes(env)) {
      environment = env + ' setting'
      break
    }
  }

  // Extract motion
  const motionKeywords = ['slow motion', 'fast motion', 'tracking', 'panning', 'zooming', 'static', 'dynamic', 'flowing']
  for (const mot of motionKeywords) {
    if (lowerContent.includes(mot)) {
      motion = mot
      break
    }
  }

  // Extract style
  const styleKeywords = ['cinematic', 'documentary', 'commercial', 'artistic', 'realistic', 'stylized', 'vintage', 'modern', 'dramatic']
  for (const st of styleKeywords) {
    if (lowerContent.includes(st)) {
      style = st
      break
    }
  }

  // Extract keywords from content
  const commonKeywords = ['professional', 'high-quality', 'detailed', 'realistic', 'dramatic', 'beautiful', 'stunning', 'epic', 'dynamic']
  keywords = commonKeywords.filter(keyword => lowerContent.includes(keyword))

  // Limit description length for database
  if (description.length > 500) {
    description = description.substring(0, 497) + '...'
  }

  return {
    description,
    style,
    camera,
    lighting,
    environment,
    elements,
    motion,
    ending,
    keywords
  }
}

// Transform scraped prompt to our database format
function transformScrapedPrompt(scrapedPrompt: ScrapedPrompt) {
  const parsedContent = parsePromptContent(scrapedPrompt.content)
  
  // Map category
  const mappedCategory = categoryMapping[scrapedPrompt.category] || 'Community'
  
  // Generate a proper title if needed
  let title = scrapedPrompt.title
  if (!title || title.length < 5) {
    title = parsedContent.description.substring(0, 50).trim()
    if (parsedContent.description.length > 50) {
      title += '...'
    }
  }

  // Combine tags and keywords
  const allKeywords = [
    ...scrapedPrompt.tags,
    ...parsedContent.keywords,
    'community',
    'ulazai',
    'veo3'
  ].filter((keyword, index, self) => self.indexOf(keyword) === index) // Remove duplicates

  return {
    title: title.substring(0, 100), // Limit title length
    description: parsedContent.description,
    style: parsedContent.style,
    camera: parsedContent.camera,
    lighting: parsedContent.lighting,
    environment: parsedContent.environment,
    elements: parsedContent.elements,
    motion: parsedContent.motion,
    ending: parsedContent.ending,
    text: scrapedPrompt.url ? `Source: ${scrapedPrompt.url}` : 'Community prompt',
    keywords: allKeywords,
    category: mappedCategory,
    is_featured: false,
    is_public: true,
    // Store original metadata in a custom field if we have one
    source_data: {
      originalAuthor: scrapedPrompt.author,
      originalCategory: scrapedPrompt.category,
      originalUrl: scrapedPrompt.url,
      originalId: scrapedPrompt.id,
      stats: {
        views: scrapedPrompt.views || 0,
        likes: scrapedPrompt.likes || 0,
        comments: scrapedPrompt.comments || 0
      },
      scrapedFrom: 'ulazai.com'
    }
  }
}

async function ingestUlazaiPrompts() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ulazai-scraped-prompts.json')
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`)
      console.log('💡 Run "npm run scrape-ulazai" first to scrape the prompts')
      process.exit(1)
    }

    console.log(`📖 Reading scraped data from ${filePath}...`)
    
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const scrapingResult: ScrapingResult = JSON.parse(fileContent)
    
    if (!scrapingResult.prompts || !Array.isArray(scrapingResult.prompts)) {
      throw new Error('Invalid scraped data format')
    }
    
    console.log(`📊 Found ${scrapingResult.prompts.length} scraped prompts to transform and insert`)
    console.log(`📅 Scraped at: ${scrapingResult.scrapedAt}`)
    
    // Transform all prompts
    const transformedPrompts = scrapingResult.prompts.map(transformScrapedPrompt)
    
    // Show sample transformations
    console.log('\n📝 Sample transformations:')
    transformedPrompts.slice(0, 3).forEach((prompt, i) => {
      console.log(`   ${i + 1}. "${prompt.title}" (${prompt.category})`)
      console.log(`      Original: ${scrapingResult.prompts[i].title}`)
      console.log(`      Keywords: ${prompt.keywords.slice(0, 5).join(', ')}`)
    })
    
    // Insert prompts in batches
    const batchSize = 10
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < transformedPrompts.length; i += batchSize) {
      const batch = transformedPrompts.slice(i, i + batchSize)
      
      console.log(`📤 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transformedPrompts.length / batchSize)}...`)
      
      const { data: insertedData, error } = await supabase
        .from('prompts')
        .insert(batch)
        .select()
      
      if (error) {
        console.error(`❌ Error inserting batch:`, error)
        console.error('Sample prompt that failed:', JSON.stringify(batch[0], null, 2))
        errorCount += batch.length
      } else {
        console.log(`✅ Successfully inserted ${insertedData?.length || 0} prompts`)
        successCount += insertedData?.length || 0
      }
      
      // Add delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Generate summary
    const categories = [...new Set(transformedPrompts.map(p => p.category))]
    const authors = [...new Set(scrapingResult.prompts.map(p => p.author))]
    
    console.log(`\n🎉 UlazAI data ingestion complete!`)
    console.log(`   ✅ Success: ${successCount} prompts`)
    console.log(`   ❌ Errors: ${errorCount} prompts`)
    console.log(`   📂 Categories: ${categories.length} (${categories.slice(0, 5).join(', ')}${categories.length > 5 ? '...' : ''})`)
    console.log(`   👥 Authors: ${authors.length} unique contributors`)
    
    // Save ingestion summary
    const summary = {
      totalScraped: scrapingResult.prompts.length,
      totalIngested: successCount,
      totalErrors: errorCount,
      categories: categories,
      topAuthors: authors.slice(0, 10),
      ingestedAt: new Date().toISOString(),
      sourceFile: filePath
    }
    
    const summaryPath = path.join(process.cwd(), 'data', 'ulazai-ingestion-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    console.log(`📋 Ingestion summary saved to ${summaryPath}`)
    
  } catch (error) {
    console.error('❌ Error during ingestion:', error)
    process.exit(1)
  }
}

// Function to check what data we have
async function checkExistingUlazaiData() {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('id, title, keywords')
      .contains('keywords', ['ulazai'])
    
    if (error) {
      console.error('❌ Error checking existing data:', error)
      return
    }
    
    console.log(`📊 Found ${data?.length || 0} existing UlazAI prompts in database`)
    
    if (data && data.length > 0) {
      console.log('Sample existing prompts:')
      data.slice(0, 3).forEach((prompt, i) => {
        console.log(`   ${i + 1}. ${prompt.title}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function main() {
  const command = process.argv[2]
  
  if (command === 'check') {
    await checkExistingUlazaiData()
  } else if (command === 'ingest') {
    await ingestUlazaiPrompts()
  } else {
    console.log('🚀 UlazAI Prompt Ingestion Tool')
    console.log('')
    console.log('Commands:')
    console.log('  npm run ingest-ulazai check   - Check existing UlazAI data')
    console.log('  npm run ingest-ulazai ingest  - Ingest scraped UlazAI prompts')
    console.log('')
    console.log('Usage:')
    console.log('  1. First run: npm run scrape-ulazai')
    console.log('  2. Then run: npm run ingest-ulazai ingest')
    
    // Default to ingest if no command specified
    await ingestUlazaiPrompts()
  }
}

if (require.main === module) {
  main().catch(console.error)
} 