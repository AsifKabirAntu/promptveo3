#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Simple transformation function
function transformPrompt(scrapedPrompt: any) {
  const cleanedCreator = scrapedPrompt.author === 'Unknown' ? 'Community Creator' : scrapedPrompt.author

  return {
    title: scrapedPrompt.title.substring(0, 200),
    description: scrapedPrompt.description || `Professional Veo 3 prompt by ${cleanedCreator}. High-quality video generation with detailed instructions.`,
    full_prompt_text: scrapedPrompt.fullPromptText || scrapedPrompt.title,
    prompt_structure: scrapedPrompt.promptStructure,
    category: 'Cinematic',
    tags: ['Veo3', 'Community', 'Professional'],
    difficulty_level: scrapedPrompt.fullPromptText?.length > 1000 ? 'Advanced' : 'Intermediate',
    creator_name: cleanedCreator,
    creator_profile_url: scrapedPrompt.authorProfile,
    style: 'Cinematic',
    camera_settings: 'Professional camera work',
    lighting: 'Natural lighting',
    environment: 'Various settings',
    motion: 'Smooth movement',
    local_video_path: scrapedPrompt.localVideoPath,
    video_thumbnail_url: scrapedPrompt.localThumbnailPath,
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
      hasVideo: !!scrapedPrompt.localVideoPath
    },
    is_featured: (scrapedPrompt.views && scrapedPrompt.views > 50) || scrapedPrompt.fullPromptText?.length > 2000,
    is_public: true,
    status: 'active'
  }
}

async function ingestPrompts() {
  try {
    console.log('📖 Reading scraped video data...')
    
    const filePath = path.join(process.cwd(), 'data', 'ulazai-with-videos-and-thumbnails.json')
    if (!fs.existsSync(filePath)) {
      console.error('❌ Video data file not found')
      return
    }

    const fileContent = fs.readFileSync(filePath, 'utf8')
    const scrapingResult = JSON.parse(fileContent)
    
    console.log(`📊 Found ${scrapingResult.prompts.length} prompts to import`)
    
    // Check if table exists, if not create it
    console.log('🗄️  Ensuring table exists...')
    
    // Try to query the table first
    const { data: existingData, error: queryError } = await supabase
      .from('community_prompts')
      .select('id')
      .limit(1)
    
    if (queryError && queryError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('📋 Creating community_prompts table...')
      
      const { error: createError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE community_prompts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            full_prompt_text TEXT NOT NULL,
            category TEXT DEFAULT 'Community',
            tags TEXT[] DEFAULT '{}',
            difficulty_level TEXT,
            creator_name TEXT NOT NULL,
            creator_profile_url TEXT,
            style TEXT,
            camera_settings TEXT,
            lighting TEXT,
            environment TEXT,
            motion TEXT,
            duration_seconds INTEGER,
            aspect_ratio TEXT,
            video_url TEXT,
            local_video_path TEXT,
            video_thumbnail_url TEXT,
            video_metadata JSONB,
            views_count INTEGER DEFAULT 0,
            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            source_url TEXT,
            source_metadata JSONB,
            is_featured BOOLEAN DEFAULT FALSE,
            is_public BOOLEAN DEFAULT TRUE,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          ALTER TABLE community_prompts ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Public prompts readable" ON community_prompts
            FOR SELECT USING (is_public = TRUE AND status = 'active');
        `
      })
      
      if (createError) {
        console.error('❌ Error creating table:', createError)
        return
      }
      
      console.log('✅ Table created successfully')
    } else {
      console.log('✅ Table already exists')
    }
    
    // Transform and insert prompts
    const transformedPrompts = scrapingResult.prompts.map(transformPrompt)
    
    console.log('📝 Sample prompt:')
    console.log(`   Title: "${transformedPrompts[0].title}"`)
    console.log(`   Creator: ${transformedPrompts[0].creator_name}`)
    console.log(`   Video: ${transformedPrompts[0].local_video_path ? '✅ Has video' : '❌ No video'}`)
    
    // Insert prompts
    console.log(`📤 Inserting ${transformedPrompts.length} prompts...`)
    
    const { data, error } = await supabase
      .from('community_prompts')
      .insert(transformedPrompts)
      .select('id, title, creator_name')
    
    if (error) {
      console.error('❌ Insert error:', error)
      return
    }
    
    console.log(`✅ Successfully inserted ${data?.length || 0} community prompts!`)
    
    if (data && data.length > 0) {
      console.log('\n🎉 Inserted prompts:')
      data.forEach((prompt, i) => {
        console.log(`   ${i + 1}. "${prompt.title}" by ${prompt.creator_name}`)
      })
    }
    
    console.log('\n🚀 Community Directory is ready!')
    console.log('   Visit /community to see your prompts')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

if (require.main === module) {
  ingestPrompts().catch(console.error)
} 