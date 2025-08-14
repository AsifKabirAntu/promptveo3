#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import { DetailedScrapedPrompt, DetailedScrapingResult } from './scrape-ulazai-prompts-detailed'

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

// Enhanced category mapping for UlazAI categories
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
  '📺 YouTube Content': 'Social Media',
  'Community': 'Community'
}

// Enhanced prompt content parsing for detailed prompts
function parseDetailedPromptContent(fullPromptText: string): {
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
  const cleanContent = fullPromptText.replace(/[\n\r]+/g, ' ').trim()
  
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

  // Try to extract structured information from the full prompt text
  const lowerContent = cleanContent.toLowerCase()

  // Enhanced extraction for actual prompt content
  
  // Extract duration if present
  const durationMatch = cleanContent.match(/duration:\s*(\d+)s?/i)
  if (durationMatch) {
    keywords.push(`${durationMatch[1]}s`)
  }

  // Extract aspect ratio
  const aspectMatch = cleanContent.match(/(?:aspect[_\s]ratio|ratio):\s*(\d+:\d+)/i)
  if (aspectMatch) {
    keywords.push(aspectMatch[1])
  }

  // Extract scene descriptions
  const sceneMatch = cleanContent.match(/scene:\s*([^.]{20,200})/i)
  if (sceneMatch) {
    description = sceneMatch[1].trim()
  }

  // Enhanced camera detection
  const cameraKeywords = [
    'close-up', 'wide shot', 'medium shot', 'overhead', 'aerial', 'pov', 'point of view',
    'tracking shot', 'handheld', 'drone', 'crane shot', 'bird\'s eye', 'low angle',
    'high angle', 'macro', 'extreme close-up', 'establishing shot', 'fisheye'
  ]
  for (const cam of cameraKeywords) {
    if (lowerContent.includes(cam)) {
      camera = cam
      break
    }
  }

  // Enhanced lighting detection
  const lightingKeywords = [
    'golden hour', 'natural light', 'studio lighting', 'dramatic lighting', 
    'soft lighting', 'harsh lighting', 'neon', 'sunset', 'daylight', 'moody lighting',
    'cinematic lighting', 'warm lighting', 'cold lighting', 'backlit', 'god rays'
  ]
  for (const light of lightingKeywords) {
    if (lowerContent.includes(light)) {
      lighting = light
      break
    }
  }

  // Enhanced environment detection
  const environmentKeywords = [
    'indoor', 'outdoor', 'studio', 'office', 'street', 'nature', 'beach', 'forest',
    'urban', 'city', 'home', 'kitchen', 'bedroom', 'living room', 'restaurant',
    'cafe', 'park', 'mountain', 'desert', 'warehouse', 'rooftop', 'alley'
  ]
  for (const env of environmentKeywords) {
    if (lowerContent.includes(env)) {
      environment = env + ' setting'
      break
    }
  }

  // Enhanced motion detection
  const motionKeywords = [
    'slow motion', 'fast motion', 'tracking', 'panning', 'zooming', 'static', 
    'dynamic', 'flowing', 'smooth movement', 'camera push', 'camera pull',
    'dolly', 'tilt', 'rotating', 'spinning', 'floating'
  ]
  for (const mot of motionKeywords) {
    if (lowerContent.includes(mot)) {
      motion = mot
      break
    }
  }

  // Enhanced style detection
  const styleKeywords = [
    'cinematic', 'documentary', 'commercial', 'artistic', 'realistic', 'stylized',
    'vintage', 'modern', 'dramatic', 'minimalist', 'retro', 'futuristic',
    'noir', 'vibrant', 'muted', 'high contrast', 'saturated'
  ]
  for (const st of styleKeywords) {
    if (lowerContent.includes(st)) {
      style = st
      break
    }
  }

  // Extract technical keywords
  const technicalKeywords = [
    'professional', 'high-quality', 'detailed', 'realistic', 'dramatic', 
    'beautiful', 'stunning', 'epic', 'dynamic', '4k', '8k', 'ultra-hd',
    'sharp', 'bokeh', 'depth of field', 'composition'
  ]
  keywords.push(...technicalKeywords.filter(keyword => lowerContent.includes(keyword)))

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

// Transform detailed scraped prompt to our database format
function transformDetailedScrapedPrompt(scrapedPrompt: DetailedScrapedPrompt) {
  const parsedContent = parseDetailedPromptContent(scrapedPrompt.fullPromptText)
  
  // Map category
  const mappedCategory = categoryMapping[scrapedPrompt.category] || 'Community'
  
  // Use the full prompt text as description if we have it
  let description = scrapedPrompt.description || parsedContent.description
  if (scrapedPrompt.fullPromptText && scrapedPrompt.fullPromptText.length > description.length) {
    description = scrapedPrompt.fullPromptText.substring(0, 500)
  }
  
  // Generate a proper title
  let title = scrapedPrompt.title
  if (!title || title.length < 5) {
    title = description.substring(0, 50).trim()
    if (description.length > 50) {
      title += '...'
    }
  }

  // Combine all keywords and tags
  const allKeywords = [
    ...scrapedPrompt.tags,
    ...parsedContent.keywords,
    'community',
    'ulazai',
    'veo3',
    'detailed'
  ].filter((keyword, index, self) => self.indexOf(keyword) === index) // Remove duplicates

  return {
    title: title.substring(0, 100),
    description: description,
    style: parsedContent.style,
    camera: parsedContent.camera,
    lighting: parsedContent.lighting,
    environment: parsedContent.environment,
    elements: parsedContent.elements,
    motion: parsedContent.motion,
    ending: parsedContent.ending,
    text: scrapedPrompt.fullPromptText || 'Community prompt',
    keywords: allKeywords,
    category: mappedCategory,
    is_featured: scrapedPrompt.views && scrapedPrompt.views > 100, // Feature popular prompts
    is_public: true,
    // Store comprehensive metadata
    source_data: {
      originalAuthor: scrapedPrompt.author,
      authorProfile: scrapedPrompt.authorProfile,
      originalCategory: scrapedPrompt.category,
      originalUrl: scrapedPrompt.url,
      originalId: scrapedPrompt.id,
      fullPromptText: scrapedPrompt.fullPromptText,
      stats: {
        views: scrapedPrompt.views || 0,
        likes: scrapedPrompt.likes || 0,
        comments: scrapedPrompt.comments || 0
      },
      media: {
        videoUrl: scrapedPrompt.videoUrl,
        videoThumbnail: scrapedPrompt.videoThumbnail
      },
      promptStructure: scrapedPrompt.promptStructure,
      scrapedFrom: 'ulazai.com',
      scrapingType: 'detailed'
    }
  }
}

async function ingestDetailedUlazaiPrompts() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ulazai-detailed-prompts.json')
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`)
      console.log('💡 Run "npm run scrape-ulazai-detailed" first to scrape the detailed prompts')
      process.exit(1)
    }

    console.log(`📖 Reading detailed scraped data from ${filePath}...`)
    
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const scrapingResult: DetailedScrapingResult = JSON.parse(fileContent)
    
    if (!scrapingResult.prompts || !Array.isArray(scrapingResult.prompts)) {
      throw new Error('Invalid detailed scraped data format')
    }
    
    console.log(`📊 Found ${scrapingResult.prompts.length} detailed scraped prompts to transform and insert`)
    console.log(`📅 Scraped at: ${scrapingResult.scrapedAt}`)
    console.log(`⚠️  Errors during scraping: ${scrapingResult.errors.length}`)
    
    // Show data quality metrics
    const promptsWithFullText = scrapingResult.prompts.filter(p => p.fullPromptText && p.fullPromptText.length > 50)
    const promptsWithAuthor = scrapingResult.prompts.filter(p => p.author && p.author !== 'Unknown')
    const promptsWithVideo = scrapingResult.prompts.filter(p => p.videoUrl)
    const promptsWithStructure = scrapingResult.prompts.filter(p => p.promptStructure)
    
    console.log(`📈 Data Quality:`)
    console.log(`   Prompts with full text: ${promptsWithFullText.length}/${scrapingResult.prompts.length}`)
    console.log(`   Prompts with known author: ${promptsWithAuthor.length}/${scrapingResult.prompts.length}`)
    console.log(`   Prompts with video: ${promptsWithVideo.length}/${scrapingResult.prompts.length}`)
    console.log(`   Prompts with structure: ${promptsWithStructure.length}/${scrapingResult.prompts.length}`)
    
    // Transform all prompts
    const transformedPrompts = scrapingResult.prompts.map(transformDetailedScrapedPrompt)
    
    // Show sample transformations
    console.log('\n📝 Sample transformations:')
    transformedPrompts.slice(0, 3).forEach((prompt, i) => {
      const original = scrapingResult.prompts[i]
      console.log(`\n   ${i + 1}. "${prompt.title}" (${prompt.category})`)
      console.log(`      Author: ${original.author}`)
      console.log(`      Original text length: ${original.fullPromptText.length} chars`)
      console.log(`      Keywords: ${prompt.keywords.slice(0, 5).join(', ')}`)
      if (original.authorProfile) {
        console.log(`      Author profile: ${original.authorProfile}`)
      }
      if (original.videoUrl) {
        console.log(`      Has video: ${original.videoUrl}`)
      }
    })
    
    // Check for duplicates before inserting
    console.log('\n🔍 Checking for existing prompts...')
    const existingUrls = transformedPrompts.map(p => p.source_data.originalUrl).filter(Boolean)
    
    if (existingUrls.length > 0) {
      const { data: existingPrompts } = await supabase
        .from('prompts')
        .select('id, source_data')
        .not('source_data', 'is', null)
      
      const existingUlazaiUrls = new Set(
        existingPrompts?.filter(p => p.source_data?.originalUrl).map(p => p.source_data.originalUrl) || []
      )
      
      console.log(`📊 Found ${existingUlazaiUrls.size} existing UlazAI prompts in database`)
      
      // Filter out duplicates
      const newPrompts = transformedPrompts.filter(p => !existingUlazaiUrls.has(p.source_data.originalUrl))
      console.log(`🆕 ${newPrompts.length} new prompts to insert (${transformedPrompts.length - newPrompts.length} duplicates skipped)`)
      
      if (newPrompts.length === 0) {
        console.log('✅ All prompts already exist in database!')
        return
      }
      
      // Use new prompts for insertion
      transformedPrompts.length = 0
      transformedPrompts.push(...newPrompts)
    }
    
    // Insert prompts in batches
    const batchSize = 5 // Smaller batches for detailed data
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
        console.log(`✅ Successfully inserted ${insertedData?.length || 0} detailed prompts`)
        successCount += insertedData?.length || 0
        
        // Show what was inserted
        if (insertedData && insertedData.length > 0) {
          console.log(`   Latest: "${insertedData[0].title}" by ${batch[0].source_data.originalAuthor}`)
        }
      }
      
      // Add delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Generate comprehensive summary
    const categories = [...new Set(transformedPrompts.map(p => p.category))]
    const authors = [...new Set(scrapingResult.prompts.map(p => p.author).filter(a => a !== 'Unknown'))]
    
    console.log(`\n🎉 Detailed UlazAI data ingestion complete!`)
    console.log(`   ✅ Success: ${successCount} prompts`)
    console.log(`   ❌ Errors: ${errorCount} prompts`)
    console.log(`   📂 Categories: ${categories.length} (${categories.slice(0, 5).join(', ')}${categories.length > 5 ? '...' : ''})`)
    console.log(`   👥 Authors: ${authors.length} unique contributors`)
    console.log(`   📹 Prompts with video: ${promptsWithVideo.length}`)
    console.log(`   🎯 Featured prompts: ${transformedPrompts.filter(p => p.is_featured).length}`)
    
    // Save comprehensive ingestion summary
    const summary = {
      totalScraped: scrapingResult.prompts.length,
      totalIngested: successCount,
      totalErrors: errorCount,
             scrapingErrorsCount: scrapingResult.errors.length,
       dataQuality: {
         promptsWithFullText: promptsWithFullText.length,
         promptsWithAuthor: promptsWithAuthor.length,
         promptsWithVideo: promptsWithVideo.length,
         promptsWithStructure: promptsWithStructure.length,
         averagePromptLength: Math.round(
           promptsWithFullText.reduce((sum, p) => sum + p.fullPromptText.length, 0) / promptsWithFullText.length
         )
       },
       categories: categories,
       topAuthors: authors.slice(0, 15),
       ingestedAt: new Date().toISOString(),
       sourceFile: filePath,
       scrapingErrorDetails: scrapingResult.errors
    }
    
    const summaryPath = path.join(process.cwd(), 'data', 'ulazai-detailed-ingestion-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    console.log(`📋 Comprehensive ingestion summary saved to ${summaryPath}`)
    
  } catch (error) {
    console.error('❌ Error during detailed ingestion:', error)
    process.exit(1)
  }
}

// Function to check what detailed data we have
async function checkExistingDetailedUlazaiData() {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('id, title, keywords, source_data')
      .contains('keywords', ['ulazai'])
      .not('source_data', 'is', null)
    
    if (error) {
      console.error('❌ Error checking existing data:', error)
      return
    }
    
    const detailedPrompts = data?.filter(p => p.source_data?.scrapingType === 'detailed') || []
    console.log(`📊 Found ${data?.length || 0} total UlazAI prompts in database`)
    console.log(`📊 Found ${detailedPrompts.length} detailed UlazAI prompts in database`)
    
    if (detailedPrompts.length > 0) {
      console.log('\nSample detailed prompts:')
      detailedPrompts.slice(0, 3).forEach((prompt, i) => {
        console.log(`   ${i + 1}. ${prompt.title}`)
        console.log(`      Author: ${prompt.source_data.originalAuthor}`)
        console.log(`      Full prompt: ${prompt.source_data.fullPromptText ? 'Yes' : 'No'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function main() {
  const command = process.argv[2]
  
  if (command === 'check') {
    await checkExistingDetailedUlazaiData()
  } else if (command === 'ingest') {
    await ingestDetailedUlazaiPrompts()
  } else {
    console.log('🚀 UlazAI Detailed Prompt Ingestion Tool')
    console.log('')
    console.log('Commands:')
    console.log('  npm run ingest-ulazai-detailed check   - Check existing detailed UlazAI data')
    console.log('  npm run ingest-ulazai-detailed ingest  - Ingest detailed scraped UlazAI prompts')
    console.log('')
    console.log('Usage:')
    console.log('  1. First run: npm run scrape-ulazai-detailed [number]')
    console.log('  2. Then run: npm run ingest-ulazai-detailed ingest')
    console.log('')
    console.log('This ingestion script handles:')
    console.log('  - Full prompt text extraction')
    console.log('  - Creator profile information')
    console.log('  - Video content URLs')
    console.log('  - Structured prompt data')
    console.log('  - Duplicate detection')
    
    // Default to ingest if no command specified
    await ingestDetailedUlazaiPrompts()
  }
}

if (require.main === module) {
  main().catch(console.error)
} 