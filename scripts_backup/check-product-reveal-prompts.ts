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

async function checkProductRevealPrompts() {
  console.log('🔍 Checking product reveal prompts in the database...')
  
  // Count total timeline prompts
  const { count: totalCount, error: totalError } = await supabase
    .from('timeline_prompts')
    .select('*', { count: 'exact', head: true })
  
  if (totalError) {
    console.error('❌ Error counting timeline prompts:', totalError)
    return
  }
  
  // Count product reveal prompts
  const { count: productRevealCount, error: categoryError } = await supabase
    .from('timeline_prompts')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'Product Reveal')
  
  if (categoryError) {
    console.error('❌ Error counting product reveal prompts:', categoryError)
    return
  }
  
  console.log(`📊 Total timeline prompts: ${totalCount}`)
  console.log(`📊 Product reveal prompts: ${productRevealCount}`)
  
  // Get a sample of product reveal prompts
  const { data: samplePrompts, error: sampleError } = await supabase
    .from('timeline_prompts')
    .select('id, title, category')
    .eq('category', 'Product Reveal')
    .limit(5)
  
  if (sampleError) {
    console.error('❌ Error fetching sample prompts:', sampleError)
    return
  }
  
  console.log('\n📋 Sample product reveal prompts:')
  samplePrompts.forEach((prompt, index) => {
    console.log(`   ${index + 1}. ${prompt.title} (ID: ${prompt.id})`)
  })
}

async function main() {
  await checkProductRevealPrompts()
}

main().catch(console.error) 