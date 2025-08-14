#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
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

interface CategoryCount {
  category: string
  count: number
}

async function checkTimelinePrompts() {
  try {
    console.log('🔎 Checking timeline prompts in the database...')
    
    // Get the count of all timeline prompts
    const { count: totalCount, error: countError } = await supabase
      .from('timeline_prompts')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      throw countError
    }
    
    console.log(`📊 Total timeline prompts in database: ${totalCount}`)
    
    // Get count by category using direct query
    const { data: categoryCounts, error: categoryError } = await supabase
      .from('timeline_prompts')
      .select('category')
    
    if (categoryError) {
      throw categoryError
    }
    
    // Count categories in JavaScript
    const categoryMap: Record<string, number> = {}
    categoryCounts.forEach(item => {
      const category = item.category
      categoryMap[category] = (categoryMap[category] || 0) + 1
    })
    
    console.log('\n📋 Timeline prompts by category:')
    Object.entries(categoryMap)
      .sort(([, countA], [, countB]) => countB - countA)
      .forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} prompts`)
      })
    
    // Get a sample prompt to verify data structure
    const { data: samplePrompt, error: sampleError } = await supabase
      .from('timeline_prompts')
      .select('*')
      .limit(1)
      .single()
    
    if (sampleError) {
      throw sampleError
    }
    
    console.log('\n📝 Sample timeline prompt structure:')
    console.log(`   - Title: ${samplePrompt.title}`)
    console.log(`   - Category: ${samplePrompt.category}`)
    console.log(`   - Timeline sequences: ${samplePrompt.timeline.length}`)
    
  } catch (error) {
    console.error('❌ Error checking timeline prompts:', error)
    process.exit(1)
  }
}

// Run the script
checkTimelinePrompts().catch(console.error) 