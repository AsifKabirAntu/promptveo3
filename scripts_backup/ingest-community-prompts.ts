#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import { VideoScrapedPrompt, VideoScrapingResult } from './scrape-ulazai-with-videos'

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

// Enhanced category mapping for better organization
const categoryMapping: Record<string, string> = {
  '🎨 Abstract': 'Abstract & Artistic',
  '⚡ Action': 'Action & Adventure',
  '🏢 Architecture': 'Architecture & Design', 
  '🎭 Behind the Scenes': 'Behind the Scenes',
  '🏢 Brand Marketing': 'Brand & Marketing',
  '💰 E-commerce Ads': 'Commercial & Ads',
  '🎓 Educational Content': 'Educational',
  '🏆 Esports': 'Sports & Gaming',
  '👥 Facebook Videos': 'Social Media',
  '🧙 Fantasy': 'Fantasy & Sci-Fi',
  '💪 Fitness & Health': 'Health & Fitness',
  '🍕 Food': 'Food & Culinary',
  '🎬 Game Trailers': 'Gaming',
  '🎮 Gaming Content': 'Gaming',
  '⭐ Gaming Reviews': 'Gaming',
  '📚 How-to Tutorials': 'Tutorials',
  '⭐ Influencer Content': 'Social Media',
  '📸 Instagram Reels': 'Social Media',
  '📱 Lifestyle Vlogs': 'Lifestyle',
  '💼 LinkedIn Professional': 'Professional',
  '😂 Memes & Comedy': 'Comedy & Entertainment',
  '🎶 Music & Dance': 'Music & Dance',
  '🌿 Nature': 'Nature & Wildlife',
  '👤 Portrait': 'Portrait & Character',
  '🛍️ Product Showcase': 'Product Demo',
  '👻 Snapchat Stories': 'Social Media',
  '📡 Streaming Content': 'Entertainment',
  '🤖 Technology': 'Technology',
  '💬 Testimonials': 'Testimonials',
  '🎵 TikTok Videos': 'Social Media',
  '📦 Unboxing Videos': 'Product Demo',
  '🔥 Viral Trends': 'Trending',
  '🐦 X (Twitter) Content': 'Social Media',
  '📺 YouTube Content': 'Entertainment',
  'Community': 'Community',
  'Uncategorized': 'Cinematic'
}

// Determine difficulty based on prompt complexity
function getDifficultyLevel(prompt: VideoScrapedPrompt): string {
  const textLength = prompt.fullPromptText.length
  const hasStructure = !!prompt.promptStructure
  const hasComplexElements = prompt.fullPromptText.includes('camera') && 
                            prompt.fullPromptText.includes('lighting') &&
                            prompt.fullPromptText.includes('motion')
  
  if (hasStructure && hasComplexElements && textLength > 1000) {
    return 'Advanced'
  } else if (hasComplexElements || textLength > 500) {
    return 'Intermediate'
  } else {
    return 'Beginner'
  }
}

// Parse camera settings from prompt
function parseCameraSettings(prompt: VideoScrapedPrompt): string {
  const text = prompt.fullPromptText.toLowerCase()
  const cameraTerms = [
    'close-up', 'wide shot', 'medium shot', 'aerial', 'drone', 'handheld',
    'tracking shot', 'pov', 'overhead', 'low angle', 'high angle', 'macro'
  ]
  
  const foundTerms = cameraTerms.filter(term => text.includes(term))
  return foundTerms.length > 0 ? foundTerms.join(', ') : 'Standard shot'
}

// Parse lighting from prompt
function parseLighting(prompt: VideoScrapedPrompt): string {
  const text = prompt.fullPromptText.toLowerCase()
  const lightingTerms = [
    'golden hour', 'natural light', 'studio lighting', 'dramatic lighting',
    'soft lighting', 'harsh lighting', 'neon', 'sunset', 'daylight', 'cinematic lighting'
  ]
  
  const foundTerms = lightingTerms.filter(term => text.includes(term))
  return foundTerms.length > 0 ? foundTerms.join(', ') : 'Natural lighting'
}

// Parse environment from prompt  
function parseEnvironment(prompt: VideoScrapedPrompt): string {
  const text = prompt.fullPromptText.toLowerCase()
  const envTerms = [
    'indoor', 'outdoor', 'studio', 'office', 'street', 'nature', 'beach',
    'forest', 'urban', 'city', 'home', 'kitchen', 'restaurant', 'park'
  ]
  
  const foundTerms = envTerms.filter(term => text.includes(term))
  return foundTerms.length > 0 ? foundTerms.join(', ') : 'Various settings'
}

// Parse motion from prompt
function parseMotion(prompt: VideoScrapedPrompt): string {
  const text = prompt.fullPromptText.toLowerCase()
  const motionTerms = [
    'slow motion', 'fast motion', 'tracking', 'panning', 'zooming',
    'static', 'dynamic', 'flowing', 'smooth', 'rotating'
  ]
  
  const foundTerms = motionTerms.filter(term => text.includes(term))
  return foundTerms.length > 0 ? foundTerms.join(', ') : 'Smooth movement'
}

// Extract duration from prompt structure or text
function extractDuration(prompt: VideoScrapedPrompt): number | null {
  if (prompt.promptStructure?.config?.duration_seconds) {
    return prompt.promptStructure.config.duration_seconds
  }
  
  const durationMatch = prompt.fullPromptText.match(/duration:\s*(\d+)s?/i)
  return durationMatch ? parseInt(durationMatch[1]) : null
}

// Extract aspect ratio from prompt
function extractAspectRatio(prompt: VideoScrapedPrompt): string | null {
  if (prompt.promptStructure?.config?.aspect_ratio) {
    return prompt.promptStructure.config.aspect_ratio
  }
  
  const aspectMatch = prompt.fullPromptText.match(/(?:aspect[_\s]ratio|ratio):\s*(\d+:\d+)/i)
  return aspectMatch ? aspectMatch[1] : null
}

// Clean creator name
function cleanCreatorName(author: string): string {
  if (!author || author === 'Unknown') return 'Community Creator'
  
  // Remove common prefixes and clean up
  let cleaned = author
    .replace(/^by\s+/i, '')
    .replace(/^the\s+/i, '')
    .trim()
  
  // Ensure it's not too long
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 47) + '...'
  }
  
  return cleaned || 'Community Creator'
}

// Transform scraped prompt to database format
function transformToDbFormat(prompt: VideoScrapedPrompt) {
  const category = categoryMapping[prompt.category] || 'Cinematic'
  const cleanedCreator = cleanCreatorName(prompt.author)
  
  // Create clean tags (no scraping references)
  const cleanTags = prompt.tags
    .filter(tag => !tag.toLowerCase().includes('ulazai') && tag.length > 1)
    .map(tag => tag.replace(/[🎨⚡🏢🎭💰🎓🏆👥🧙💪🍕🎬🎮⭐📚📸📱💼😂🎶🌿👤🛍️👻📡🤖💬🎵📦🔥🐦📺]/g, '').trim())
    .filter(tag => tag.length > 0)
    .slice(0, 8) // Limit to 8 tags
  
  // Add category and style as tags
  cleanTags.push(category)
  if (prompt.promptStructure?.style?.visual_aesthetic) {
    cleanTags.push(prompt.promptStructure.style.visual_aesthetic)
  }
  
  return {
    title: prompt.title.substring(0, 200), // Ensure title fits
    description: prompt.description?.substring(0, 500) || 
                `Professional Veo 3 prompt by ${cleanedCreator}. High-quality video generation with detailed instructions.`,
    full_prompt_text: prompt.fullPromptText,
    category: category,
    tags: [...new Set(cleanTags)], // Remove duplicates
    difficulty_level: getDifficultyLevel(prompt),
    
    creator_name: cleanedCreator,
    creator_profile_url: prompt.authorProfile,
    
    prompt_structure: prompt.promptStructure,
    style: prompt.promptStructure?.style?.visual_aesthetic || 'Cinematic',
    camera_settings: parseCameraSettings(prompt),
    lighting: parseLighting(prompt),
    environment: parseEnvironment(prompt),
    motion: parseMotion(prompt),
    duration_seconds: extractDuration(prompt),
    aspect_ratio: extractAspectRatio(prompt),
    
    video_url: null, // We'll handle video upload separately
    local_video_path: prompt.localVideoPath,
    video_thumbnail_url: prompt.videoThumbnail,
    video_metadata: prompt.videoMetadata,
    
    views_count: prompt.views || 0,
    likes_count: prompt.likes || 0,
    comments_count: prompt.comments || 0,
    
    source_url: prompt.url,
    source_metadata: {
      originalId: prompt.id,
      originalUrl: prompt.url,
      originalAuthor: prompt.author,
      originalCategory: prompt.category,
      scrapedAt: new Date().toISOString(),
      hasVideo: !!prompt.localVideoPath
    },
    
    is_featured: (prompt.views && prompt.views > 50) || prompt.fullPromptText.length > 2000,
    is_public: true,
    status: 'active'
  }
}

async function setupDatabase() {
  console.log('🗄️  Setting up community prompts database...')
  
  try {
    // Read and execute the schema
    const schemaPath = path.join(process.cwd(), 'database', 'community-prompts-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Execute schema (split by function/trigger boundaries)
    const statements = schema.split(/(?=CREATE|ALTER|COMMENT)/g).filter(s => s.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('execute_sql', { sql: statement })
        if (error) {
          console.error(`⚠️  Schema execution warning:`, error.message)
        }
      }
    }
    
    console.log('✅ Database schema setup complete')
    
  } catch (error) {
    console.error('❌ Database setup error:', error)
    // Continue anyway - table might already exist
  }
}

async function ingestCommunityPrompts(dataFile: string = 'ulazai-with-videos.json') {
  try {
    const filePath = path.join(process.cwd(), 'data', dataFile)
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`)
      console.log('💡 Run "npm run scrape-ulazai-videos [number]" first to scrape prompts')
      process.exit(1)
    }

    console.log(`📖 Reading scraped data from ${filePath}...`)
    
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const scrapingResult: VideoScrapingResult = JSON.parse(fileContent)
    
    if (!scrapingResult.prompts || !Array.isArray(scrapingResult.prompts)) {
      throw new Error('Invalid scraped data format')
    }
    
    console.log(`📊 Found ${scrapingResult.prompts.length} scraped prompts to import`)
    console.log(`🎬 Videos downloaded: ${scrapingResult.videosDownloaded}`)
    
    // Setup database first
    await setupDatabase()
    
    // Check for existing prompts to avoid duplicates
    console.log('\n🔍 Checking for existing prompts...')
    const { data: existingPrompts } = await supabase
      .from('community_prompts')
      .select('source_metadata')
      .not('source_metadata', 'is', null)
    
    const existingIds = new Set(
      existingPrompts
        ?.filter(p => p.source_metadata?.originalId)
        .map(p => p.source_metadata.originalId) || []
    )
    
    console.log(`📊 Found ${existingIds.size} existing prompts in database`)
    
    // Filter out duplicates
    const newPrompts = scrapingResult.prompts.filter(p => !existingIds.has(p.id))
    console.log(`🆕 ${newPrompts.length} new prompts to insert (${scrapingResult.prompts.length - newPrompts.length} duplicates skipped)`)
    
    if (newPrompts.length === 0) {
      console.log('✅ All prompts already exist in database!')
      return
    }
    
    // Transform all prompts
    const transformedPrompts = newPrompts.map(transformToDbFormat)
    
    // Show sample transformations
    console.log('\n📝 Sample transformations:')
    transformedPrompts.slice(0, 3).forEach((prompt, i) => {
      const original = newPrompts[i]
      console.log(`\n   ${i + 1}. "${prompt.title}"`)
      console.log(`      Creator: ${prompt.creator_name}`)
      console.log(`      Category: ${prompt.category}`)
      console.log(`      Difficulty: ${prompt.difficulty_level}`)
      console.log(`      Tags: ${prompt.tags.slice(0, 4).join(', ')}`)
      console.log(`      Video: ${original.localVideoPath ? '✅ Downloaded' : '❌ No video'}`)
    })
    
    // Insert prompts in batches
    const batchSize = 10
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < transformedPrompts.length; i += batchSize) {
      const batch = transformedPrompts.slice(i, i + batchSize)
      
      console.log(`📤 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transformedPrompts.length / batchSize)}...`)
      
      const { data: insertedData, error } = await supabase
        .from('community_prompts')
        .insert(batch)
        .select('id, title, creator_name')
      
      if (error) {
        console.error(`❌ Error inserting batch:`, error)
        errorCount += batch.length
      } else {
        console.log(`✅ Successfully inserted ${insertedData?.length || 0} community prompts`)
        successCount += insertedData?.length || 0
        
        // Show what was inserted
        if (insertedData && insertedData.length > 0) {
          console.log(`   Latest: "${insertedData[0].title}" by ${insertedData[0].creator_name}`)
        }
      }
      
      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Generate final statistics
    const categories = [...new Set(transformedPrompts.map(p => p.category))]
    const creators = [...new Set(transformedPrompts.map(p => p.creator_name))]
    const withVideos = transformedPrompts.filter(p => p.local_video_path)
    const featured = transformedPrompts.filter(p => p.is_featured)
    
    console.log(`\n🎉 Community Directory ingestion complete!`)
    console.log(`   ✅ Success: ${successCount} prompts`)
    console.log(`   ❌ Errors: ${errorCount} prompts`)
    console.log(`   📂 Categories: ${categories.length} (${categories.slice(0, 5).join(', ')}${categories.length > 5 ? '...' : ''})`)
    console.log(`   👥 Creators: ${creators.length} unique contributors`)
    console.log(`   🎬 Prompts with videos: ${withVideos.length}`)
    console.log(`   ⭐ Featured prompts: ${featured.length}`)
    console.log(`   🚀 Ready for Community Directory!`)
    
    // Save ingestion summary
    const summary = {
      totalScraped: scrapingResult.prompts.length,
      totalIngested: successCount,
      totalErrors: errorCount,
      videosAvailable: withVideos.length,
      featuredPrompts: featured.length,
      categories: categories,
      topCreators: creators.slice(0, 10),
      ingestedAt: new Date().toISOString(),
      readyForProduction: successCount > 0 && errorCount === 0
    }
    
    const summaryPath = path.join(process.cwd(), 'data', 'community-ingestion-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    console.log(`📋 Summary saved to ${summaryPath}`)
    
  } catch (error) {
    console.error('❌ Error during community prompts ingestion:', error)
    process.exit(1)
  }
}

async function main() {
  const command = process.argv[2]
  const dataFile = process.argv[3]
  
  if (command === 'setup') {
    await setupDatabase()
  } else if (command === 'ingest') {
    await ingestCommunityPrompts(dataFile)
  } else {
    console.log('🚀 Community Directory Ingestion Tool')
    console.log('')
    console.log('Commands:')
    console.log('  npm run ingest-community setup              - Setup database schema')
    console.log('  npm run ingest-community ingest [file]      - Ingest scraped prompts')
    console.log('')
    console.log('Usage:')
    console.log('  1. First run: npm run scrape-ulazai-videos [number]')
    console.log('  2. Then run: npm run ingest-community ingest')
    console.log('')
    console.log('This will create a clean Community Directory with:')
    console.log('  - Professional prompt cards')
    console.log('  - Creator attribution (no scraping mentions)')
    console.log('  - Video examples')
    console.log('  - Search and filtering')
    
    // Default to ingest
    await ingestCommunityPrompts(dataFile)
  }
}

if (require.main === module) {
  main().catch(console.error)
} 