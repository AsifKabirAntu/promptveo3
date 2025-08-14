import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ScrapedPrompt {
  id: string
  title: string
  description?: string
  fullPromptText?: string
  promptStructure?: any
  author?: string
  authorProfile?: string
  category?: string
  tags?: string[]
  views?: number
  likes?: number
  comments?: number
  url?: string
  videoUrl?: string
  localVideoPath?: string
  videoThumbnail?: string
  localThumbnailPath?: string
  videoMetadata?: any
}

function transformPrompt(scrapedPrompt: ScrapedPrompt) {
  const cleanedCreator = scrapedPrompt.author === 'Unknown' ? 'Community Creator' : scrapedPrompt.author
  
  return {
    title: scrapedPrompt.title.substring(0, 200),
    description: scrapedPrompt.description || `Professional Veo 3 prompt by ${cleanedCreator}. High-quality video generation with detailed instructions.`,
    full_prompt_text: scrapedPrompt.fullPromptText || scrapedPrompt.title,
    prompt_structure: scrapedPrompt.promptStructure,
    category: 'Cinematic', // Simplified for now
    tags: ['Veo3', 'Community', 'Professional'], // Simplified for now
    difficulty_level: (scrapedPrompt.fullPromptText?.length || 0) > 1000 ? 'Advanced' : 'Intermediate',
    creator_name: cleanedCreator,
    creator_profile_url: scrapedPrompt.authorProfile,
    style: 'Cinematic', // Simplified
    camera_settings: 'Professional camera work', // Simplified
    lighting: 'Natural lighting', // Simplified
    environment: 'Various settings', // Simplified
    motion: 'Smooth movement', // Simplified
    local_video_path: scrapedPrompt.localVideoPath,
    // Use local thumbnail path if available, otherwise null
    video_thumbnail_url: scrapedPrompt.localThumbnailPath ? `/api/thumbnails/${scrapedPrompt.localThumbnailPath}` : null,
    video_metadata: scrapedPrompt.videoMetadata,
    views_count: scrapedPrompt.views || 0,
    likes_count: scrapedPrompt.likes || 0,
    comments_count: scrapedPrompt.comments || 0,
    source_url: scrapedPrompt.url,
    source_metadata: {
      originalId: scrapedPrompt.id,
      originalUrl: scrapedPrompt.url,
      originalAuthor: scrapedPrompt.author,
      scrapedAt: new Date().toISOString(),
      hasVideo: !!scrapedPrompt.localVideoPath,
      hasThumbnail: !!scrapedPrompt.localThumbnailPath,
      originalThumbnailUrl: scrapedPrompt.videoThumbnail
    },
    is_featured: (scrapedPrompt.views && scrapedPrompt.views > 50) || (scrapedPrompt.fullPromptText?.length || 0) > 2000,
    is_public: true,
    status: 'active'
  }
}

async function main() {
  console.log('🚀 Starting Community Prompts Ingestion with Thumbnails')
  console.log('======================================================')
  
  // Check for the enhanced data file with thumbnails first
  const dataWithThumbnailsPath = path.join(process.cwd(), 'data', 'ulazai-with-videos-and-thumbnails.json')
  const originalDataPath = path.join(process.cwd(), 'data', 'ulazai-with-videos.json')
  
  let dataPath: string
  let hasThumbnails = false
  
  if (fs.existsSync(dataWithThumbnailsPath)) {
    dataPath = dataWithThumbnailsPath
    hasThumbnails = true
    console.log('📁 Using enhanced data with thumbnails')
  } else if (fs.existsSync(originalDataPath)) {
    dataPath = originalDataPath
    console.log('📁 Using original data (no local thumbnails)')
  } else {
    console.error('❌ No data file found! Run scraping first.')
    return
  }
  
  console.log(`📂 Loading data from: ${dataPath}`)
  
  try {
    const rawData = fs.readFileSync(dataPath, 'utf8')
    const parsedData = JSON.parse(rawData)
    const scrapedPrompts: ScrapedPrompt[] = parsedData.prompts || parsedData
    
    console.log(`📊 Found ${scrapedPrompts.length} prompts to ingest`)
    if (hasThumbnails) {
      const withThumbnails = scrapedPrompts.filter(p => p.localThumbnailPath).length
      console.log(`🖼️  ${withThumbnails} prompts have local thumbnails`)
    }
    
    let successCount = 0
    let errorCount = 0
    let duplicateCount = 0
    
    for (let i = 0; i < scrapedPrompts.length; i++) {
      const scrapedPrompt = scrapedPrompts[i]
      
      try {
        console.log(`\n📝 Processing ${i + 1}/${scrapedPrompts.length}: ${scrapedPrompt.title.substring(0, 50)}...`)
        
        // Check if already exists
        const { data: existing } = await supabase
          .from('community_prompts')
          .select('id')
          .eq('source_metadata->>originalId', scrapedPrompt.id)
          .single()
        
        if (existing) {
          console.log('⏭️  Already exists, skipping')
          duplicateCount++
          continue
        }
        
        const transformedPrompt = transformPrompt(scrapedPrompt)
        
        const { error } = await supabase
          .from('community_prompts')
          .insert(transformedPrompt)
        
        if (error) {
          console.error('❌ Insert error:', error.message)
          errorCount++
        } else {
          console.log('✅ Successfully ingested')
          successCount++
        }
        
      } catch (error) {
        console.error(`❌ Error processing prompt ${i + 1}:`, error)
        errorCount++
      }
    }
    
    console.log('\n🎉 Ingestion Complete!')
    console.log('=====================')
    console.log(`📊 Total prompts: ${scrapedPrompts.length}`)
    console.log(`✅ Successfully ingested: ${successCount}`)
    console.log(`⏭️  Duplicates skipped: ${duplicateCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    
    if (hasThumbnails) {
      console.log('\n🖼️  Thumbnail Features:')
      console.log('   • Local thumbnails served via /api/thumbnails/[filename]')
      console.log('   • No external dependencies on ulazai.com for images')
      console.log('   • Cached thumbnails for fast loading')
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
} 