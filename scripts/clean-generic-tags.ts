import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Generic tags to remove
const GENERIC_TAGS = [
  'featured',
  'advanced', 
  'general',
  'beginner',
  'intermediate',
  'basic',
  'premium',
  'free',
  'popular',
  'trending',
  'new',
  'hot',
  'recent'
]

async function cleanGenericTags() {
  console.log('🧹 Starting generic tag cleanup...')
  
  try {
    // Get all prompts with their current tags
    const { data: prompts, error: fetchError } = await supabase
      .from('community_prompts')
      .select('id, extracted_tags, tags')
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`📊 Found ${prompts?.length || 0} prompts to process`)
    
    let updated = 0
    let errors = 0
    
    for (const prompt of prompts || []) {
      try {
        let hasChanges = false
        let cleanedExtractedTags: string[] = []
        let cleanedTags: string[] = []
        
        // Clean extracted_tags
        if (prompt.extracted_tags && Array.isArray(prompt.extracted_tags)) {
          cleanedExtractedTags = prompt.extracted_tags.filter(tag => 
            !GENERIC_TAGS.includes(tag.toLowerCase().trim())
          )
          if (cleanedExtractedTags.length !== prompt.extracted_tags.length) {
            hasChanges = true
          }
        }
        
        // Clean regular tags
        if (prompt.tags && Array.isArray(prompt.tags)) {
          cleanedTags = prompt.tags.filter(tag => 
            !GENERIC_TAGS.includes(tag.toLowerCase().trim())
          )
          if (cleanedTags.length !== prompt.tags.length) {
            hasChanges = true
          }
        }
        
        // Update if changes needed
        if (hasChanges) {
          const { error: updateError } = await supabase
            .from('community_prompts')
            .update({
              extracted_tags: cleanedExtractedTags,
              tags: cleanedTags,
              updated_at: new Date().toISOString()
            })
            .eq('id', prompt.id)
          
          if (updateError) {
            console.error(`❌ Error updating prompt ${prompt.id}:`, updateError)
            errors++
          } else {
            updated++
            console.log(`✅ Cleaned tags for prompt ${prompt.id}`)
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing prompt ${prompt.id}:`, error)
        errors++
      }
    }
    
    console.log('\n🎉 Generic tag cleanup completed!')
    console.log(`📊 Results:`)
    console.log(`   Prompts updated: ${updated}`)
    console.log(`   Errors: ${errors}`)
    console.log(`   Total processed: ${prompts?.length || 0}`)
    
    if (updated > 0) {
      console.log('\n✨ Generic tags removed successfully!')
      console.log('🏷️ You can now generate meaningful content-based tags')
    }
    
  } catch (error) {
    console.error('❌ Failed to clean generic tags:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  cleanGenericTags().catch(console.error)
}

export { cleanGenericTags } 