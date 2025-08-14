#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please set:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Interface for prompt data
interface PromptData {
  title?: string  // Made optional
  description: string
  style: string
  camera: string
  lighting: string
  environment: string
  elements: string[]
  motion: string
  ending: string
  text?: string
  keywords: string[]
  timeline?: string  // Added timeline field (optional)
  category?: string  // Made optional
  is_featured?: boolean
  is_public?: boolean
}

// Function to ingest data from a JSON file
async function ingestFromJSON(filePath: string) {
  try {
    console.log(`📖 Reading data from ${filePath}...`)
    
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(fileContent)
    
    // Ensure data is an array
    const prompts = Array.isArray(data) ? data : [data]
    
    console.log(`📊 Found ${prompts.length} prompts to insert`)
    
    // Insert prompts in batches
    const batchSize = 10
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize)
      
      console.log(`📤 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(prompts.length / batchSize)}...`)
      
      const { data: insertedData, error } = await supabase
        .from('prompts')
        .insert(batch.map((prompt: PromptData) => {
          // Generate title from description if missing
          const title = prompt.title || prompt.description?.substring(0, 50).trim() + (prompt.description?.length > 50 ? '...' : '') || 'Untitled Prompt'
          
          // Set default category if missing
          const category = prompt.category || 'Cinematic'
          
          return {
            title: title,
            description: prompt.description,
            style: prompt.style || 'cinematic', // Default style if null
            camera: prompt.camera || 'medium shot', // Default camera if null
            lighting: prompt.lighting || 'natural lighting', // Default lighting if null
            environment: prompt.environment || 'studio setting', // Default environment if null
            elements: prompt.elements || [],
            motion: prompt.motion || 'smooth movement', // Default motion if null
            ending: prompt.ending || 'fade out', // Default ending if null
            text: prompt.text || 'none',
            keywords: prompt.keywords || [],
            timeline: prompt.timeline || null,  // Timeline field (optional)
            category: category,
            is_featured: prompt.is_featured || false,
            is_public: prompt.is_public !== false, // Default to true unless explicitly false
          }
        }))
        .select()
      
      if (error) {
        console.error(`❌ Error inserting batch:`, error)
        errorCount += batch.length
      } else {
        console.log(`✅ Successfully inserted ${batch.length} prompts`)
        successCount += batch.length
      }
    }
    
    console.log(`\n🎉 Data ingestion complete!`)
    console.log(`   ✅ Success: ${successCount} prompts`)
    console.log(`   ❌ Errors: ${errorCount} prompts`)
    
  } catch (error) {
    console.error('❌ Error reading or parsing file:', error)
    process.exit(1)
  }
}

// Function to ingest data from CSV file
async function ingestFromCSV(filePath: string) {
  console.log('📝 CSV ingestion not implemented yet. Please convert your CSV to JSON format.')
  console.log('   Example JSON structure:')
  console.log(JSON.stringify({
    title: "Example Prompt",
    description: "A beautiful cinematic scene...",
    style: "Cinematic",
    camera: "Wide shot",
    lighting: "Golden hour",
    environment: "Beach at sunset",
    elements: ["person", "ocean", "sunset"],
    motion: "Slow motion",
    ending: "Fade to black",
    text: "none",
    keywords: ["beach", "sunset", "cinematic"],
    category: "Nature",
    is_featured: false,
    is_public: true
  }, null, 2))
}

// Function to clear all existing prompts (use with caution!)
async function clearAllPrompts() {
  console.log('⚠️  WARNING: This will delete ALL prompts from the database!')
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...')
  
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  const { error } = await supabase
    .from('prompts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (using a condition that's always true)
  
  if (error) {
    console.error('❌ Error clearing prompts:', error)
  } else {
    console.log('✅ All prompts cleared from database')
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const filePath = args[1]
  
  console.log('🚀 PromptVeo3 Data Ingestion Tool\n')
  
  switch (command) {
    case 'json':
      if (!filePath) {
        console.error('❌ Please provide a JSON file path')
        console.log('   Usage: npm run ingest json path/to/your/prompts.json')
        process.exit(1)
      }
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`)
        process.exit(1)
      }
      
      await ingestFromJSON(filePath)
      break
      
    case 'csv':
      if (!filePath) {
        console.error('❌ Please provide a CSV file path')
        console.log('   Usage: npm run ingest csv path/to/your/prompts.csv')
        process.exit(1)
      }
      
      await ingestFromCSV(filePath)
      break
      
    case 'clear':
      await clearAllPrompts()
      break
      
    default:
      console.log('📋 Available commands:')
      console.log('   npm run ingest json <file>  - Import prompts from JSON file')
      console.log('   npm run ingest csv <file>   - Import prompts from CSV file')
      console.log('   npm run ingest clear        - Clear all prompts (DANGEROUS)')
      console.log('\n📝 JSON format example:')
      console.log('   [')
      console.log('     {')
      console.log('       "title": "Epic Mountain Vista",')
      console.log('       "description": "A breathtaking view of snow-capped mountains...",')
      console.log('       "style": "Cinematic",')
      console.log('       "camera": "Wide establishing shot",')
      console.log('       "lighting": "Golden hour, warm sunlight",')
      console.log('       "environment": "Mountain peak at sunrise",')
      console.log('       "elements": ["mountains", "snow", "sunrise", "clouds"],')
      console.log('       "motion": "Slow pan across the landscape",')
      console.log('       "ending": "Zoom into the distant valley",')
      console.log('       "text": "none",')
      console.log('       "keywords": ["nature", "mountains", "epic", "sunrise"],')
      console.log('       "category": "Nature",')
      console.log('       "is_featured": true,')
      console.log('       "is_public": true')
      console.log('     }')
      console.log('   ]')
  }
}

// Run the script
main().catch(console.error) 