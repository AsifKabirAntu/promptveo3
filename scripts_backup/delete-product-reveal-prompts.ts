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

async function deleteProductRevealPrompts() {
  console.log('⚠️  WARNING: This will delete ALL prompts with category "Product Reveal" from the database!')
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...')
  
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  console.log('🗑️  Deleting product reveal prompts...')
  
  // First, count how many prompts will be deleted
  const { count, error: countError } = await supabase
    .from('timeline_prompts')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'Product Reveal')
  
  if (countError) {
    console.error('❌ Error counting product reveal prompts:', countError)
    return
  }
  
  console.log(`📊 Found ${count} product reveal prompts to delete`)
  
  // Delete all prompts with category "Product Reveal"
  const { error: deleteError } = await supabase
    .from('timeline_prompts')
    .delete()
    .eq('category', 'Product Reveal')
  
  if (deleteError) {
    console.error('❌ Error deleting product reveal prompts:', deleteError)
    return
  }
  
  console.log('✅ Successfully deleted all product reveal prompts')
  
  // Verify deletion
  const { count: remainingCount, error: verifyError } = await supabase
    .from('timeline_prompts')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'Product Reveal')
  
  if (verifyError) {
    console.error('❌ Error verifying deletion:', verifyError)
    return
  }
  
  console.log(`📊 Remaining product reveal prompts: ${remainingCount}`)
  console.log(`📊 Total prompts deleted: ${count}`)
}

async function main() {
  await deleteProductRevealPrompts()
}

main().catch(console.error) 