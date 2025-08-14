import { createClient } from '@supabase/supabase-js'
import puppeteer, { Browser, Page } from 'puppeteer'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function scrapeAndUpdate(limit?: number) {
  let browser: Browser | null = null
  let updated = 0
  let errors: string[] = []
  
  try {
    console.log('🚀 Starting working scraper...')
    
    // Get prompts from database
    console.log('📋 Fetching prompts from database...')
    let query = supabase
      .from('community_prompts')
      .select('id, title, source_url')
      .not('source_url', 'is', null)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: prompts, error } = await query

    if (error) {
      throw new Error(`Failed to fetch prompts: ${error.message}`)
    }

    if (!prompts || prompts.length === 0) {
      console.log('❌ No prompts found')
      return
    }

    console.log(`📊 Found ${prompts.length} prompts to process`)
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i]
      console.log(`\n📄 Processing ${i+1}/${prompts.length}: ${prompt.title}`)
      console.log(`🔍 URL: ${prompt.source_url}`)
      
      try {
        await page.goto(prompt.source_url, { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        })
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Extract data using simple, working approach
        const result = await page.evaluate(() => {
          // Get title
          const titleEl = document.querySelector('h1')
          const title = titleEl ? titleEl.textContent?.trim() : 'Untitled'
          
          // Get the main description (usually in a p tag with substantial content)
          let description = ''
          const paragraphs = document.querySelectorAll('p')
          for (const p of paragraphs) {
            if (p.textContent && p.textContent.length > 50) {
              const text = p.textContent.trim()
              if (text.length > description.length) {
                description = text
              }
            }
          }
          
          // Try to find creator info
          let creatorName = 'Anonymous'
          let creatorUrl = ''
          
          // Look for links that might be creator profiles
          const links = document.querySelectorAll('a')
          for (const link of links) {
            const href = link.getAttribute('href')
            if (href && (href.includes('/user/') || href.includes('/profile/'))) {
              creatorName = link.textContent?.trim() || 'Anonymous'
              creatorUrl = href.startsWith('/') ? 'https://ulazai.com' + href : href
              break
            }
          }
          
          // Extract simple tags from any badge-like elements
          const tags: string[] = []
          const tagElements = document.querySelectorAll('.badge, .tag, .chip')
          tagElements.forEach(el => {
            const tag = el.textContent?.trim()
            if (tag && tag.length < 30 && !tags.includes(tag)) {
              tags.push(tag)
            }
          })
          
          return {
            title: title || 'Untitled',
            description: description || 'No description found',
            creatorName,
            creatorUrl: creatorUrl || null,
            tags
          }
        })
        
        console.log(`✅ Extracted:`)
        console.log(`   Title: ${result.title}`)
        console.log(`   Description: ${result.description.substring(0, 100)}...`)
        console.log(`   Creator: ${result.creatorName}`)
        console.log(`   Tags: ${result.tags.join(', ')}`)
        
        // Update database
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({
            veo3_prompt: result.description,
            clean_description: result.description,
            creator_name: result.creatorName,
            creator_profile_url: result.creatorUrl,
            extracted_tags: result.tags.length > 0 ? result.tags : null,
            updated_at: new Date().toISOString()
          })
          .eq('source_url', prompt.source_url)

        if (updateError) {
          console.error(`❌ Database update failed:`, updateError)
          errors.push(`${prompt.source_url}: ${updateError.message}`)
        } else {
          updated++
          console.log(`✅ Updated database`)
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${prompt.source_url}:`, error)
        errors.push(`${prompt.source_url}: ${error}`)
      }
      
      // Add delay between requests
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
  } catch (error) {
    console.error('❌ Main process failed:', error)
  } finally {
    if (browser) {
      await browser.close()
    }
    
    console.log('\n🎉 Scraping completed!')
    console.log(`📊 Results:`)
    console.log(`   Total processed: ${updated + errors.length}`)
    console.log(`   Successfully updated: ${updated}`)
    console.log(`   Errors: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:')
      errors.slice(0, 3).forEach(error => console.log(`   ${error}`))
    }
  }
}

async function main() {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined
  console.log(`🎯 Processing ${limit ? `first ${limit}` : 'all'} prompts...`)
  await scrapeAndUpdate(limit)
}

if (require.main === module) {
  main().catch(console.error)
} 