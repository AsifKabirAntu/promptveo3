import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Predefined categories based on common video content types
const VIDEO_CATEGORIES = {
  'Cinematic/Film': ['cinematic', 'film', 'movie', 'dramatic', 'noir', 'epic', 'camera', 'shot', 'lens', 'angle'],
  'Fantasy/Sci-Fi': ['fantasy', 'sci-fi', 'magic', 'alien', 'space', 'futuristic', 'supernatural', 'mystical', 'enchanted'],
  'Comedy/Humor': ['comedy', 'funny', 'humor', 'quirky', 'viral', 'meme', 'satirical', 'comical'],
  'Brand/Commercial': ['brand', 'product', 'commercial', 'logo', 'marketing', 'McDonald', 'Coca', 'IKEA', 'Adidas'],
  'Nature/Wildlife': ['nature', 'ocean', 'forest', 'wildlife', 'animal', 'underwater', 'landscape', 'outdoor'],
  'Action/Adventure': ['action', 'adventure', 'chase', 'fight', 'battle', 'rescue', 'danger', 'thrilling'],
  'Music/Entertainment': ['music', 'dance', 'performance', 'concert', 'rap', 'hip', 'entertainment'],
  'Horror/Dark': ['horror', 'dark', 'gothic', 'scary', 'eerie', 'nightmare', 'disturbing', 'sinister'],
  'Food/Culinary': ['food', 'cooking', 'culinary', 'restaurant', 'kitchen', 'meal', 'chef', 'dining'],
  'Tech/AI': ['tech', 'AI', 'digital', 'cyber', 'robot', 'technology', 'computer', 'virtual'],
  'Sports/Fitness': ['sports', 'fitness', 'athletic', 'gym', 'exercise', 'competition', 'training'],
  'Art/Creative': ['art', 'creative', 'artistic', 'design', 'aesthetic', 'visual', 'abstract', 'painterly'],
  'Lifestyle/Vlog': ['lifestyle', 'vlog', 'personal', 'daily', 'casual', 'relatable', 'authentic'],
  'Corporate/Business': ['corporate', 'business', 'professional', 'office', 'meeting', 'executive'],
  'Travel/Adventure': ['travel', 'journey', 'exploration', 'adventure', 'destination', 'tourism'],
  'Anime/Animation': ['anime', 'animation', 'cartoon', 'animated', 'character', 'manga'],
  'Romance/Emotional': ['romance', 'love', 'emotional', 'heartwarming', 'tender', 'intimate'],
  'Educational/Tutorial': ['educational', 'tutorial', 'learning', 'instruction', 'guide', 'how-to'],
  'Gaming/Pixel': ['gaming', 'game', 'pixel', 'RPG', 'virtual', 'console', '16-bit'],
  'Fashion/Beauty': ['fashion', 'beauty', 'style', 'makeup', 'clothing', 'model', 'glamour']
}

function categorizeFromTags(tags: string[]): string {
  if (!tags || tags.length === 0) return 'General'
  
  // Convert tags to lowercase for better matching
  const lowerTags = tags.map(tag => tag.toLowerCase())
  
  // Score each category based on tag matches
  const categoryScores: { [key: string]: number } = {}
  
  for (const [category, keywords] of Object.entries(VIDEO_CATEGORIES)) {
    let score = 0
    for (const keyword of keywords) {
      // Direct match
      if (lowerTags.includes(keyword)) {
        score += 2
      }
      // Partial match (tag contains keyword or vice versa)
      for (const tag of lowerTags) {
        if (tag.includes(keyword) || keyword.includes(tag)) {
          score += 1
        }
      }
    }
    if (score > 0) {
      categoryScores[category] = score
    }
  }
  
  // Return the category with the highest score
  if (Object.keys(categoryScores).length === 0) return 'General'
  
  const bestCategory = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)[0][0]
  
  return bestCategory
}

async function analyzeAndCategorize() {
  console.log('🤖 Starting AI-powered prompt categorization...')
  
  try {
    // Get all prompts with their extracted_tags
    const { data: prompts, error: fetchError } = await supabase
      .from('community_prompts')
      .select('id, title, extracted_tags, clean_description')
      .order('id')

    if (fetchError) {
      throw fetchError
    }

    console.log(`📊 Found ${prompts?.length || 0} prompts to categorize`)

    if (!prompts || prompts.length === 0) {
      console.log('⚠️  No prompts found')
      return
    }

    let processed = 0
    let updated = 0
    const categoryStats: { [key: string]: number } = {}

    for (const prompt of prompts) {
      processed++
      
      // Categorize based on extracted_tags
      const category = categorizeFromTags(prompt.extracted_tags || [])
      
      // Update the prompt with the new category
      const { error: updateError } = await supabase
        .from('community_prompts')
        .update({ prompt_category: category })
        .eq('id', prompt.id)

      if (updateError) {
        console.error(`❌ Error updating prompt ${prompt.id}:`, updateError)
        continue
      }

      updated++
      
      // Track category statistics
      categoryStats[category] = (categoryStats[category] || 0) + 1
      
      // Progress indicator
      if (processed % 50 === 0) {
        console.log(`📄 Progress: ${processed}/${prompts.length} (${Math.round(processed/prompts.length*100)}%)`)
      }
    }

    console.log('\n🎉 Categorization completed!')
    console.log(`📊 Results:`)
    console.log(`   Total processed: ${processed}`)
    console.log(`   Successfully updated: ${updated}`)
    console.log(`   Errors: ${processed - updated}`)
    
    console.log('\n📈 Category Distribution:')
    const sortedCategories = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b - a)
    
    for (const [category, count] of sortedCategories) {
      const percentage = Math.round((count / updated) * 100)
      console.log(`   ${category}: ${count} prompts (${percentage}%)`)
    }

  } catch (error) {
    console.error('❌ Error during categorization:', error)
  }
}

async function main() {
  console.log('🚀 Starting prompt categorization process...')
  console.log('⚠️  Make sure you have run the SQL to add the prompt_category column first!')
  console.log('   Execute: database/add-prompt-category-column.sql in Supabase dashboard')
  
  // Wait for user confirmation
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Categorize all prompts
  await analyzeAndCategorize()
  
  console.log('✨ Process completed!')
}

if (require.main === module) {
  main().catch(console.error)
} 