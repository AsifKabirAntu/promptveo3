#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import { config } from 'dotenv'

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

// Interface for branded room transformation prompt data structure
interface BrandedRoomTransformationPromptData {
  title: string
  category: string
  description: string
  style: string
  camera: string
  lighting: string
  environment: string
  elements: string[]
  motion: string
  ending: string
  text: string
  keywords: string[]
}

async function ingestBrandedRoomTransformation20Prompts() {
  try {
    const filePath = 'data/branded_real_room_transformation_20.json'
    console.log(`📖 Reading data from ${filePath}...`)
    
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const prompts = JSON.parse(fileContent) as BrandedRoomTransformationPromptData[]
    
    if (!Array.isArray(prompts)) {
      throw new Error('JSON data is not an array')
    }
    
    console.log(`📊 Found ${prompts.length} branded room transformation prompts to insert`)
    
    // Insert prompts in batches to avoid hitting API limits
    const batchSize = 10
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize)
      
      console.log(`📤 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(prompts.length / batchSize)}...`)
      
      const { data: insertedData, error } = await supabase
        .from('prompts')
        .insert(batch.map((prompt) => ({
          title: prompt.title,
          description: prompt.description,
          style: prompt.style,
          camera: prompt.camera,
          lighting: prompt.lighting,
          environment: prompt.environment,
          elements: prompt.elements,
          motion: prompt.motion,
          ending: prompt.ending,
          text: prompt.text || 'none',
          keywords: prompt.keywords,
          category: prompt.category,
          is_featured: false,
          is_public: true
        })))
        .select()
      
      if (error) {
        console.error(`❌ Error inserting batch:`, error)
        errorCount += batch.length
      } else {
        console.log(`✅ Successfully inserted ${insertedData?.length || 0} prompts`)
        successCount += insertedData?.length || 0
      }
      
      // Add a small delay between batches to prevent API rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`\n🎉 Branded room transformation 20 data ingestion complete!`)
    console.log(`   ✅ Success: ${successCount} prompts`)
    console.log(`   ❌ Errors: ${errorCount} prompts`)
    
  } catch (error) {
    console.error('❌ Error reading or parsing file:', error)
    process.exit(1)
  }
}

// Run the script
ingestBrandedRoomTransformation20Prompts().catch(console.error) 