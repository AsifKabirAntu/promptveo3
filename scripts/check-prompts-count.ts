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

async function checkPromptsCount() {
  try {
    console.log('🔎 Checking prompts count in the database...')
    
    // Get the count of all prompts
    const { count: totalCount, error: countError } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      throw countError
    }
    
    console.log(`📊 Total prompts in database: ${totalCount}`)
    
    // Get count by category using a simpler approach
    const { data: categories, error: categoryError } = await supabase
      .rpc('get_prompts_by_category')
    
    if (categoryError) {
      console.log('❌ Error fetching category counts: ', categoryError)
      console.log('Trying alternative approach...')
      
      // Alternative approach: fetch all prompts and count categories in JavaScript
      const { data: allPrompts, error: promptsError } = await supabase
        .from('prompts')
        .select('category')
      
      if (promptsError) {
        throw promptsError
      }
      
      const categoryCounts: Record<string, number> = {}
      allPrompts?.forEach(prompt => {
        const category = prompt.category || 'Uncategorized'
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      })
      
      console.log('\n📋 Prompts by category:')
      Object.entries(categoryCounts).forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} prompts`)
      })
    } else {
      console.log('\n📋 Prompts by category:')
      categories.forEach((item: CategoryCount) => {
        console.log(`   - ${item.category}: ${item.count} prompts`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error checking prompts count:', error)
    process.exit(1)
  }
}

// Run the script
checkPromptsCount().catch(console.error) 