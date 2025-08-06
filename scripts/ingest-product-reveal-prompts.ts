#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import { TimelinePromptData } from '../src/types/timeline-prompt'

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

// Function to ingest product reveal prompts from JSON
async function ingestProductRevealPrompts() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'product_reveal_prompts.json')
    console.log(`📖 Reading product reveal prompts from ${filePath}...`)
    
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(fileContent)
    
    // Ensure data is an array
    const prompts = Array.isArray(data) ? data : [data]
    
    console.log(`📊 Found ${prompts.length} product reveal prompts to insert`)
    
    // Insert prompts in batches
    const batchSize = 10
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize)
      
      console.log(`📤 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(prompts.length / batchSize)}...`)
      
      const { data: insertedData, error } = await supabase
        .from('timeline_prompts')
        .insert(batch.map((prompt: TimelinePromptData) => ({
          title: prompt.title,
          description: prompt.description,
          category: prompt.category,
          base_style: prompt.base_style,
          aspect_ratio: prompt.aspect_ratio || '16:9',
          scene_description: prompt.scene_description,
          camera_setup: prompt.camera_setup,
          lighting: prompt.lighting || '', // Handle empty lighting fields
          negative_prompts: prompt.negative_prompts || [],
          timeline: prompt.timeline, // JSONB field
          is_featured: prompt.is_featured || false,
          is_public: prompt.is_public !== false, // Default to true
        })))
        .select()
      
      if (error) {
        console.error(`❌ Error inserting batch:`, error)
        errorCount += batch.length
      } else {
        console.log(`✅ Successfully inserted ${insertedData?.length || 0} product reveal prompts`)
        successCount += insertedData?.length || 0
      }
    }
    
    console.log(`\n🎉 Product reveal prompts ingestion complete!`)
    console.log(`   ✅ Success: ${successCount} prompts`)
    console.log(`   ❌ Errors: ${errorCount} prompts`)
    
  } catch (error) {
    console.error('❌ Error reading or parsing file:', error)
    process.exit(1)
  }
}

// Main function
async function main() {
  console.log('🚀 PromptVeo3 Product Reveal Prompts Ingestion Tool\n')
  await ingestProductRevealPrompts()
}

// Run the script
main().catch(console.error) 