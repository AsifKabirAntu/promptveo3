#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
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

async function setupCommunityDatabase() {
  console.log('🗄️  Setting up community prompts database...')
  
  try {
    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS community_prompts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        full_prompt_text TEXT NOT NULL,
        category TEXT DEFAULT 'Community',
        tags TEXT[] DEFAULT '{}',
        difficulty_level TEXT CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
        creator_name TEXT NOT NULL,
        creator_profile_url TEXT,
        prompt_structure JSONB,
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
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'pending')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    const { error: tableError } = await supabase.rpc('query', { query: createTableSQL })
    if (tableError) {
      console.log('⚠️  Table may already exist:', tableError.message)
    } else {
      console.log('✅ Community prompts table created')
    }
    
    // Enable RLS
    const { error: rlsError } = await supabase.rpc('query', { 
      query: 'ALTER TABLE community_prompts ENABLE ROW LEVEL SECURITY;' 
    })
    if (rlsError) {
      console.log('⚠️  RLS already enabled or error:', rlsError.message)
    }
    
    // Create a simple policy for reading
    const { error: policyError } = await supabase.rpc('query', { 
      query: `
        CREATE POLICY "Public prompts are readable by everyone" ON community_prompts
        FOR SELECT USING (is_public = TRUE AND status = 'active');
      `
    })
    if (policyError) {
      console.log('⚠️  Policy may already exist:', policyError.message)
    }
    
    console.log('✅ Database setup complete!')
    
  } catch (error) {
    console.error('❌ Setup error:', error)
  }
}

if (require.main === module) {
  setupCommunityDatabase().catch(console.error)
} 