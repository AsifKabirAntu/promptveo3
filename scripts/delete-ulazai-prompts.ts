import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteUlazaiPrompts() {
  try {
    console.log('🔍 Searching for prompts by author "ulazai"...')
    
    // First, let's see how many prompts exist for this author
    const { data: existingPrompts, error: countError } = await supabase
      .from('community_prompts')
      .select('id, title, creator_name')
      .eq('creator_name', 'ulazai')
    
    if (countError) {
      console.error('❌ Error counting prompts:', countError)
      return
    }
    
    if (!existingPrompts || existingPrompts.length === 0) {
      console.log('✅ No prompts found for author "ulazai"')
      return
    }
    
    console.log(`📊 Found ${existingPrompts.length} prompts by "ulazai":`)
    existingPrompts.slice(0, 10).forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.title} (ID: ${prompt.id})`)
    })
    
    if (existingPrompts.length > 10) {
      console.log(`   ... and ${existingPrompts.length - 10} more`)
    }
    
    console.log('\n🗑️  Deleting all prompts by "ulazai"...')
    
    // Delete all prompts by ulazai
    const { data: deletedData, error: deleteError } = await supabase
      .from('community_prompts')
      .delete()
      .eq('creator_name', 'ulazai')
      .select('id')
    
    if (deleteError) {
      console.error('❌ Error deleting prompts:', deleteError)
      return
    }
    
    console.log(`✅ Successfully deleted ${deletedData?.length || 0} prompts by "ulazai"`)
    
    // Verify deletion
    const { data: remainingPrompts, error: verifyError } = await supabase
      .from('community_prompts')
      .select('id')
      .eq('creator_name', 'ulazai')
    
    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError)
      return
    }
    
    if (!remainingPrompts || remainingPrompts.length === 0) {
      console.log('✅ Verification complete: No prompts remain for author "ulazai"')
    } else {
      console.log(`⚠️  Warning: ${remainingPrompts.length} prompts still exist for "ulazai"`)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the deletion
deleteUlazaiPrompts()
  .then(() => {
    console.log('\n🎉 Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }) 