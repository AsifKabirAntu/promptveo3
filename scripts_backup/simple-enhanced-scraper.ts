import { createClient } from '@supabase/supabase-js'
import puppeteer, { Browser, Page } from 'puppeteer'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface EnhancedPromptData {
  url: string
  title: string
  clean_description: string
  veo3_prompt: string
  category: string
  difficulty_level?: string
  creator_name: string
  creator_profile_url?: string
  extracted_tags: string[]
}

class SimpleEnhancedScraper {
  private browser: Browser | null = null
  private page: Page | null = null
  private errors: string[] = []
  private processed = 0
  private updated = 0

  async init() {
    console.log('🚀 Initializing Simple Enhanced Scraper...')
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    this.page = await this.browser.newPage()
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
  }

  async extractEnhancedData(url: string): Promise<EnhancedPromptData | null> {
    try {
      console.log(`🔍 Scraping: ${url}`)
      
      await this.page!.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      })
      
      await new Promise(resolve => setTimeout(resolve, 2000))

      const data = await this.page!.evaluate(() => {
        // Helper function to clean text
        const cleanText = (text: string): string => {
          return text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim()
        }

        // Extract title
        let title = ''
        const titleSelectors = ['h1', '.title', '[data-testid="title"]']
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector)
          if (element && element.textContent) {
            title = cleanText(element.textContent)
            break
          }
        }

        // Extract main description/prompt content
        let description = ''
        const descSelectors = [
          'p', '.description', '.prompt-content', '.content', 
          'div[class*="prompt"]', 'div[class*="content"]'
        ]
        
        for (const selector of descSelectors) {
          const elements = document.querySelectorAll(selector)
          for (const element of elements) {
            if (element.textContent && element.textContent.length > 50) {
              const text = cleanText(element.textContent)
              if (text.length > description.length) {
                description = text
              }
            }
          }
        }

        // Extract creator info
        let creatorName = ''
        let creatorProfileUrl = ''
        const creatorSelectors = [
          'a[href*="/user/"]', 'a[href*="/profile/"]', 
          '.author', '.creator', '.user-name',
          '[class*="author"]', '[class*="creator"]'
        ]
        
        for (const selector of creatorSelectors) {
          const element = document.querySelector(selector)
          if (element) {
            creatorName = cleanText(element.textContent || '')
            if (element.getAttribute('href')) {
              creatorProfileUrl = element.getAttribute('href') || ''
              if (creatorProfileUrl.startsWith('/')) {
                creatorProfileUrl = 'https://ulazai.com' + creatorProfileUrl
              }
            }
            break
          }
        }

        // Extract category
        let category = 'General'
        const categorySelectors = [
          '.category', '.tag', '.badge', 
          '[class*="category"]', '[class*="tag"]'
        ]
        
        for (const selector of categorySelectors) {
          const element = document.querySelector(selector)
          if (element && element.textContent) {
            category = cleanText(element.textContent)
            break
          }
        }

        // Extract tags
        const tags: string[] = []
        const tagSelectors = [
          '.tag', '.badge', '.chip', 
          '[class*="tag"]', '[class*="badge"]'
        ]
        
        for (const selector of tagSelectors) {
          const elements = document.querySelectorAll(selector)
          elements.forEach(element => {
            if (element.textContent) {
              const tag = cleanText(element.textContent)
              if (tag && tag.length < 30 && !tags.includes(tag)) {
                tags.push(tag)
              }
            }
          })
        }

        return {
          title: title || 'Untitled',
          description: description || 'No description found',
          creatorName: creatorName || 'Anonymous',
          creatorProfileUrl: creatorProfileUrl || null,
          category: category,
          tags: tags
        }
      })

      // Process the extracted data
      const result: EnhancedPromptData = {
        url: url,
        title: data.title,
        clean_description: data.description,
        veo3_prompt: data.description, // Use description as prompt for now
        category: data.category,
        difficulty_level: undefined,
        creator_name: data.creatorName,
        creator_profile_url: data.creatorProfileUrl || undefined,
        extracted_tags: data.tags
      }

      return result

    } catch (error) {
      console.error(`❌ Error scraping ${url}:`, error)
      this.errors.push(`${url}: ${error}`)
      return null
    }
  }

  async updatePromptInDatabase(data: EnhancedPromptData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('community_prompts')
        .update({
          clean_description: data.clean_description,
          veo3_prompt: data.veo3_prompt,
          category: data.category,
          difficulty_level: data.difficulty_level,
          creator_name: data.creator_name,
          creator_profile_url: data.creator_profile_url,
          extracted_tags: data.extracted_tags,
          updated_at: new Date().toISOString()
        })
        .eq('source_url', data.url)

      if (error) {
        console.error(`❌ Database update failed for ${data.url}:`, error)
        this.errors.push(`DB Error for ${data.url}: ${error.message}`)
        return false
      }

      console.log(`✅ Updated: ${data.title}`)
      return true

    } catch (error) {
      console.error(`❌ Database error for ${data.url}:`, error)
      this.errors.push(`DB Exception for ${data.url}: ${error}`)
      return false
    }
  }

  async processPrompts(limit?: number): Promise<void> {
    try {
      console.log('📋 Fetching existing prompts from database...')
      
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
        console.log('❌ No prompts found in database')
        return
      }

      console.log(`📊 Found ${prompts.length} prompts to update`)
      console.log('🚀 Starting enhanced re-scraping...')

      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i]
        this.processed++
        
        console.log(`\n📄 Processing ${this.processed}/${prompts.length}: ${prompt.title}`)
        
        const extractedData = await this.extractEnhancedData(prompt.source_url)
        
        if (extractedData) {
          const success = await this.updatePromptInDatabase(extractedData)
          if (success) {
            this.updated++
          }
        }

        // Add delay between requests
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

    } catch (error) {
      console.error('❌ Process failed:', error)
      this.errors.push(`Process error: ${error}`)
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  printResults() {
    console.log('\n🎉 Simple Enhanced re-scraping completed!')
    console.log('📊 Results:')
    console.log(`   Total processed: ${this.processed}`)
    console.log(`   Successfully updated: ${this.updated}`)
    console.log(`   Errors: ${this.errors.length}`)

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:')
      this.errors.slice(0, 5).forEach(error => {
        console.log(`   ${error}`)
      })
      if (this.errors.length > 5) {
        console.log(`   ... and ${this.errors.length - 5} more errors`)
      }
    }
  }
}

async function main() {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined
  
  console.log(`🎯 Processing ${limit ? `first ${limit}` : 'all'} prompts...`)
  
  const scraper = new SimpleEnhancedScraper()
  
  try {
    await scraper.init()
    await scraper.processPrompts(limit)
  } catch (error) {
    console.error('❌ Main process failed:', error)
  } finally {
    scraper.printResults()
    await scraper.close()
  }
}

if (require.main === module) {
  main().catch(console.error)
} 