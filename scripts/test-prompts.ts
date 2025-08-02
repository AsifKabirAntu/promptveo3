import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testPrompts() {
  try {
    console.log('Testing prompts system...')
    
    // Test 1: Check if prompts table exists and has data
    console.log('\n1. Testing prompts table...')
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_public', true)
      .limit(5)
    
    if (promptsError) {
      console.error('Error accessing prompts table:', promptsError)
    } else {
      console.log('✅ Prompts table is accessible')
      console.log(`Found ${prompts?.length || 0} public prompts`)
      if (prompts && prompts.length > 0) {
        console.log('Sample prompt:', {
          id: prompts[0].id,
          title: prompts[0].title,
          category: prompts[0].category,
          is_public: prompts[0].is_public
        })
      }
    }
    
    // Test 2: Check if timeline_prompts table exists and has data
    console.log('\n2. Testing timeline_prompts table...')
    const { data: timelinePrompts, error: timelineError } = await supabase
      .from('timeline_prompts')
      .select('*')
      .eq('is_public', true)
      .limit(5)
    
    if (timelineError) {
      console.error('Error accessing timeline_prompts table:', timelineError)
    } else {
      console.log('✅ Timeline prompts table is accessible')
      console.log(`Found ${timelinePrompts?.length || 0} public timeline prompts`)
      if (timelinePrompts && timelinePrompts.length > 0) {
        console.log('Sample timeline prompt:', {
          id: timelinePrompts[0].id,
          title: timelinePrompts[0].title,
          category: timelinePrompts[0].category,
          is_public: timelinePrompts[0].is_public
        })
      }
    }
    
    // Test 3: Check categories
    console.log('\n3. Testing categories...')
    const { data: categories, error: categoriesError } = await supabase
      .from('prompts')
      .select('category')
      .eq('is_public', true)
    
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
    } else {
      const uniqueCategories = [...new Set(categories?.map(p => p.category).filter(Boolean))]
      console.log('✅ Categories fetched successfully')
      console.log(`Found ${uniqueCategories.length} unique categories:`, uniqueCategories)
    }
    
    // Test 4: Check styles
    console.log('\n4. Testing styles...')
    const { data: styles, error: stylesError } = await supabase
      .from('prompts')
      .select('style')
      .eq('is_public', true)
    
    if (stylesError) {
      console.error('Error fetching styles:', stylesError)
    } else {
      const uniqueStyles = [...new Set(styles?.map(p => p.style).filter(Boolean))]
      console.log('✅ Styles fetched successfully')
      console.log(`Found ${uniqueStyles.length} unique styles:`, uniqueStyles)
    }
    
    // Test 5: Check if we need to seed data
    const totalPrompts = (prompts?.length || 0) + (timelinePrompts?.length || 0)
    if (totalPrompts === 0) {
      console.log('\n⚠️  No prompts found in database!')
      console.log('You may need to run the data ingestion script:')
      console.log('npm run ingest')
      console.log('npm run ingest-timeline')
    } else {
      console.log(`\n✅ Found ${totalPrompts} total prompts in database`)
    }
    
    console.log('\n✅ Prompts system test completed!')
    
  } catch (error) {
    console.error('Error in testPrompts:', error)
  }
}

testPrompts() 