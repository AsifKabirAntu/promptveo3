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

// Function to ingest timeline prompts from JSON
async function ingestTimelineFromJSON(filePath: string) {
  try {
    console.log(`📖 Reading timeline data from ${filePath}...`)
    
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(fileContent)
    
    // Ensure data is an array
    const prompts = Array.isArray(data) ? data : [data]
    
    console.log(`📊 Found ${prompts.length} timeline prompts to insert`)
    
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
          lighting: prompt.lighting,
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
        console.log(`✅ Successfully inserted ${batch.length} timeline prompts`)
        successCount += batch.length
      }
    }
    
    console.log(`\n🎉 Timeline data ingestion complete!`)
    console.log(`   ✅ Success: ${successCount} prompts`)
    console.log(`   ❌ Errors: ${errorCount} prompts`)
    
  } catch (error) {
    console.error('❌ Error reading or parsing file:', error)
    process.exit(1)
  }
}

// Function to clear all timeline prompts
async function clearTimelinePrompts() {
  console.log('⚠️  WARNING: This will delete ALL timeline prompts from the database!')
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...')
  
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  const { error } = await supabase
    .from('timeline_prompts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
  
  if (error) {
    console.error('❌ Error clearing timeline prompts:', error)
  } else {
    console.log('✅ All timeline prompts cleared from database')
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const filePath = args[1]
  
  console.log('🚀 PromptVeo3 Timeline Data Ingestion Tool\n')
  
  switch (command) {
    case 'json':
      if (!filePath) {
        console.error('❌ Please provide a JSON file path')
        console.log('   Usage: npm run ingest-timeline json path/to/your/timeline-prompts.json')
        process.exit(1)
      }
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`)
        process.exit(1)
      }
      
      await ingestTimelineFromJSON(filePath)
      break
      
    case 'clear':
      await clearTimelinePrompts()
      break
      
    default:
      console.log('📋 Available commands:')
      console.log('   npm run ingest-timeline json <file>  - Import timeline prompts from JSON file')
      console.log('   npm run ingest-timeline clear        - Clear all timeline prompts (DANGEROUS)')
      console.log('\n📝 JSON format example:')
      console.log('   {')
      console.log('     "title": "LEGO Dream Build #1",')
      console.log('     "description": "A cinematic unboxing experience...",')
      console.log('     "category": "Creative",')
      console.log('     "base_style": "cinematic, photorealistic, 4K",')
      console.log('     "aspect_ratio": "16:9",')
      console.log('     "scene_description": "A sealed LEGO box sits...",')
      console.log('     "camera_setup": "fixed wide-angle shot...",')
      console.log('     "lighting": "natural warm light...",')
      console.log('     "negative_prompts": ["no people", "no text"],')
      console.log('     "timeline": [')
      console.log('       {')
      console.log('         "sequence": 1,')
      console.log('         "timestamp": "00:00-00:01",')
      console.log('         "action": "The LEGO box begins to tremble...",')
      console.log('         "audio": "Low rumble in a quiet room"')
      console.log('       }')
      console.log('     ]')
      console.log('   }')
  }
}

// Run the script
main().catch(console.error) 