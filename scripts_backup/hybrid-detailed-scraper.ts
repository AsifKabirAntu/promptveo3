import { createClient } from '@supabase/supabase-js'
import puppeteer, { Browser, Page } from 'puppeteer'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function scrapeDetailedPromptData(limit?: number) {
  let browser: Browser | null = null
  let updated = 0
  let errors: string[] = []
  
  try {
    console.log('🚀 Starting hybrid detailed scraper...')
    
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
      throw new Error(`Database query failed: ${error.message}`)
    }

    if (!prompts || prompts.length === 0) {
      console.log('❌ No prompts found in database')
      return
    }

    console.log(`📊 Found ${prompts.length} prompts to process\n`)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    // Process each prompt
    for (const [index, prompt] of prompts.entries()) {
      console.log(`📄 Processing ${index + 1}/${prompts.length}: ${prompt.title}`)
      
      try {
        console.log(`🔍 URL: ${prompt.source_url}`)
        await page.goto(prompt.source_url!, { waitUntil: 'networkidle0', timeout: 30000 })
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Extract all data in a simple way
        const title = await page.$eval('h1', el => el?.textContent?.trim()).catch(() => prompt.title)
        
        // Get page text for analysis
        const pageText = await page.evaluate(() => document.body.textContent || '')
        
        // Extract description (first substantial paragraph)
        const description = await page.evaluate(() => {
          const paragraphs = Array.from(document.querySelectorAll('p'))
          for (const p of paragraphs) {
            const text = p.textContent?.trim() || ''
            if (text.length > 50 && !text.toLowerCase().includes('login') && !text.toLowerCase().includes('sign up')) {
              return text
            }
          }
          return 'No description available'
        })

        // Extract creator info
        const creatorInfo = await page.evaluate(() => {
          // Look for links that might be creator profiles
          const creatorLinks = Array.from(document.querySelectorAll('a'))
          for (const link of creatorLinks) {
            const href = link.href
            const text = link.textContent?.trim() || ''
            if (href && (href.includes('/user/') || href.includes('/creator/') || href.includes('/profile/')) && text.length > 0 && text.length < 50) {
              return {
                name: text,
                profileUrl: href
              }
            }
          }
          
          // Fallback: look for text that might be creator name
          const allText = document.body.textContent || ''
          const byMatch = allText.match(/(?:by|created by|author:?)\s+([a-zA-Z0-9_\s]{2,30})/i)
          if (byMatch) {
            return {
              name: byMatch[1].trim(),
              profileUrl: null
            }
          }
          
          return {
            name: 'Unknown Creator',
            profileUrl: null
          }
        })

        // Extract category from page elements
        const category = await page.evaluate(() => {
          const categorySelectors = [
            '[class*="category"]',
            '[class*="tag"]',
            '.badge'
          ]
          
          for (const selector of categorySelectors) {
            const elements = document.querySelectorAll(selector)
            for (const el of elements) {
              const text = el.textContent?.trim() || ''
              if (text.length > 2 && text.length < 30 && !text.toLowerCase().includes('tag')) {
                return text
              }
            }
          }
          return 'General'
        })

        // Extract tags
        const tags = await page.evaluate(() => {
          const tagElements = Array.from(document.querySelectorAll('.tag, [class*="tag"], .hashtag, .badge'))
          const extractedTags: string[] = []
          
          tagElements.forEach(el => {
            const text = el.textContent?.trim() || ''
            if (text.length > 1 && text.length < 30 && !text.toLowerCase().includes('category')) {
              extractedTags.push(text.replace(/^#/, ''))
            }
          })
          
          // Also look for hashtags in text
          const allText = document.body.textContent || ''
          const hashtagMatches = allText.match(/#[a-zA-Z0-9_]{2,20}/g)
          if (hashtagMatches) {
            hashtagMatches.forEach(tag => {
              extractedTags.push(tag.replace('#', ''))
            })
          }
          
          // Remove duplicates and limit
          return [...new Set(extractedTags)].slice(0, 10)
        })

        // Extract clean prompt content
        let veo3Prompt = description // fallback
        
        // Look for JSON content or structured prompt
        const codeBlocks = await page.evaluate(() => {
          const codeElements = Array.from(document.querySelectorAll('pre, code, [class*="code"], [class*="prompt"]'))
          return codeElements.map(el => el.textContent?.trim() || '').filter(text => text.length > 50)
        })
        
        if (codeBlocks.length > 0) {
          veo3Prompt = codeBlocks[0]
        }

        // Try to parse JSON if it looks like JSON
        if (veo3Prompt.includes('{') && veo3Prompt.includes('}')) {
          try {
            const jsonMatch = veo3Prompt.match(/\{[^}]*\}/g)
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0])
              if (parsed.prompt || parsed.description) {
                veo3Prompt = parsed.prompt || parsed.description
              }
            }
          } catch (e) {
            // Keep original if JSON parsing fails
          }
        }

        // Update database with all extracted data
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({
            veo3_prompt: veo3Prompt,
            clean_description: description,
            category: category,
            creator_name: creatorInfo.name,
            creator_profile_url: creatorInfo.profileUrl,
            extracted_tags: tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', prompt.id)

        if (updateError) {
          console.error(`❌ Database update error:`, updateError)
          errors.push(`DB update ${prompt.id}: ${updateError.message}`)
        } else {
          updated++
          console.log(`✅ Extracted detailed data:`)
          console.log(`   Title: ${title}`)
          console.log(`   Creator: ${creatorInfo.name}`)
          console.log(`   Profile URL: ${creatorInfo.profileUrl || 'None'}`)
          console.log(`   Category: ${category}`)
          console.log(`   Tags: ${tags.join(', ') || 'None'}`)
          console.log(`   Description: ${description.substring(0, 100)}...`)
          console.log(`   Prompt: ${veo3Prompt.substring(0, 100)}...\n`)
        }

      } catch (error) {
        console.error(`❌ Error processing ${prompt.source_url}:`, error)
        errors.push(`${prompt.source_url}: ${error}`)
      }

      // Add delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

  } catch (error) {
    console.error('❌ Scraping failed:', error)
    errors.push(`General error: ${error}`)
  } finally {
    if (browser) {
      await browser.close()
    }
    
    console.log('\n🎉 Hybrid detailed scraping completed!')
    console.log('📊 Results:')
    console.log(`   Total processed: ${updated + errors.length}`)
    console.log(`   Successfully updated: ${updated}`)
    console.log(`   Errors: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const limit = args[0] ? parseInt(args[0]) : undefined
  
  await scrapeDetailedPromptData(limit)
}

if (require.main === module) {
  main().catch(console.error)
} 