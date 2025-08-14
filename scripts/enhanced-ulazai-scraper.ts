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

class EnhancedUlazAIScraper {
  private browser: Browser | null = null
  private page: Page | null = null
  private errors: string[] = []
  private processed = 0
  private updated = 0

  async init() {
    console.log('🚀 Initializing Enhanced UlazAI Scraper...')
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    this.page = await this.browser.newPage()
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
  }

  async extractEnhancedData(url: string): Promise<EnhancedPromptData | null> {
    try {
      console.log(`🔍 Scraping: ${url}`)
      
      if (!this.page) throw new Error('Page not initialized')
      
      await this.page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      })
      
      await new Promise(resolve => setTimeout(resolve, 2000))

      const data = await this.page.evaluate((pageUrl) => {
        // Helper function to clean text
        const cleanText = (text: string): string => {
          return text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim()
        }

        // Extract title (main heading)
        const titleSelectors = ['h1', '.prompt-title', '[data-testid="title"]']
        let title = ''
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            title = cleanText(element.textContent)
            break
          }
        }

        // Extract category and difficulty from breadcrumbs/badges
        let category = ''
        let difficulty = ''
        
        // Look for category with emoji
        const categorySelectors = [
          'nav a[href*="category"]',
          '.breadcrumb a',
          '.category',
          '.badge',
          'span[class*="category"]'
        ]
        
        for (const selector of categorySelectors) {
          const elements = document.querySelectorAll(selector)
          for (const el of elements) {
            const text = el.textContent?.trim() || ''
            if (text.includes('🤖') || text.includes('🌿') || text.includes('🎨') || text.includes('🎬')) {
              category = cleanText(text)
              break
            }
          }
          if (category) break
        }

        // Look for difficulty level
        const difficultyKeywords = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
        const allText = document.body.textContent || ''
        for (const keyword of difficultyKeywords) {
          if (allText.includes(keyword)) {
            difficulty = keyword
            break
          }
        }

        // Extract description from the dedicated section
        const descSelectors = [
          '.description p',
          '[data-section="description"]',
          'h3:contains("Description") + p',
          'section:has(h3:contains("Description")) p'
        ]
        
        let description = ''
        for (const selector of descSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            description = cleanText(element.textContent)
            break
          }
        }

        // Extract Veo 3 Prompt content (this is the key improvement)
        let veo3Prompt = ''
        
        // Strategy 1: Look for dedicated "Veo 3 Prompt" section
        const veoSections = document.querySelectorAll('h3, h4, h5, .section-title')
        for (const section of veoSections) {
          const text = section.textContent?.trim() || ''
          if (text.toLowerCase().includes('veo 3 prompt') || text.toLowerCase().includes('veo3 prompt')) {
            // Get the next element or following content
            let nextElement = section.nextElementSibling
            while (nextElement && !nextElement.textContent?.trim()) {
              nextElement = nextElement.nextElementSibling
            }
            if (nextElement?.textContent?.trim()) {
              veo3Prompt = cleanText(nextElement.textContent)
              break
            }
          }
        }

        // Strategy 2: Look for prompt in code/pre blocks
        if (!veo3Prompt) {
          const codeSelectors = ['pre', 'code', '.prompt-content', '.code-block']
          for (const selector of codeSelectors) {
            const elements = document.querySelectorAll(selector)
            for (const el of elements) {
              const text = el.textContent?.trim() || ''
              if (text.length > 100 && (
                text.toLowerCase().includes('cinematic') ||
                text.toLowerCase().includes('video') ||
                text.toLowerCase().includes('shot') ||
                text.toLowerCase().includes('scene')
              )) {
                veo3Prompt = cleanText(text)
                break
              }
            }
            if (veo3Prompt) break
          }
        }

        // Extract creator information
        let creatorName = ''
        let creatorProfileUrl = ''

        // Look for creator section
        const creatorSelectors = [
          '.creator-name',
          '.author',
          '[data-testid="creator"]',
          'a[href*="profile"]',
          '.profile-link'
        ]

        for (const selector of creatorSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            creatorName = cleanText(element.textContent)
            
            // Check if it's a link to get profile URL
            if (element.tagName === 'A') {
              const href = (element as HTMLAnchorElement).href
              if (href && href.includes('profile')) {
                creatorProfileUrl = href
              }
            }
            break
          }
        }

        // Fallback: look for "by [name]" pattern
        if (!creatorName) {
          const byPattern = /by\s+([A-Za-z0-9\s]+)/i
          const match = document.body.textContent?.match(byPattern)
          if (match && match[1]) {
            creatorName = cleanText(match[1])
          }
        }

        // Extract tags
        const tags: string[] = []
        const tagSelectors = [
          '.tag',
          '.hashtag',
          '[class*="tag"]',
          'span[class*="badge"]'
        ]

        for (const selector of tagSelectors) {
          const elements = document.querySelectorAll(selector)
          for (const el of elements) {
            const text = el.textContent?.trim() || ''
            if (text.startsWith('#') && text.length > 1 && text.length < 30) {
              tags.push(text.replace('#', ''))
            }
          }
        }

        // Remove duplicates
        const uniqueTags = [...new Set(tags)]

        return {
          url: pageUrl,
          title: title || 'Untitled',
          clean_description: description,
          veo3_prompt: veo3Prompt,
          category: category,
          difficulty_level: difficulty || null,
          creator_name: creatorName || 'Anonymous',
          creator_profile_url: creatorProfileUrl || null,
          extracted_tags: uniqueTags
        }
      }, url)

      return data as EnhancedPromptData

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

  async processAllPrompts(limit?: number): Promise<void> {
    try {
      console.log('📋 Fetching existing prompts from database...')
      
      let query = supabase
        .from('community_prompts')
        .select('source_url, title')
        .not('source_url', 'is', null)
        .order('created_at', { ascending: true })

      if (limit) {
        query = query.limit(limit)
      }

      const { data: prompts, error } = await query

      if (error) {
        throw new Error(`Failed to fetch prompts: ${error.message}`)
      }

      if (!prompts || prompts.length === 0) {
        console.log('❌ No prompts found with source URLs')
        return
      }

      console.log(`📊 Found ${prompts.length} prompts to update`)
      console.log('🚀 Starting enhanced re-scraping...\n')

      for (const prompt of prompts) {
        this.processed++
        console.log(`📄 Processing ${this.processed}/${prompts.length}: ${prompt.title}`)
        
        const enhancedData = await this.extractEnhancedData(prompt.source_url)
        if (enhancedData) {
          const success = await this.updatePromptInDatabase(enhancedData)
          if (success) {
            this.updated++
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      console.log('\n🎉 Enhanced re-scraping completed!')
      console.log(`📊 Results:`)
      console.log(`   Total processed: ${this.processed}`)
      console.log(`   Successfully updated: ${this.updated}`)
      console.log(`   Errors: ${this.errors.length}`)
      
      if (this.errors.length > 0) {
        console.log('\n❌ Errors:')
        this.errors.forEach(error => console.log(`   ${error}`))
      }

    } catch (error) {
      console.error('💥 Fatal error during processing:', error)
      throw error
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }
}

// CLI interface
async function main() {
  const scraper = new EnhancedUlazAIScraper()
  
  try {
    await scraper.init()
    
    // Get limit from command line args (optional)
    const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined
    
    if (limit) {
      console.log(`🎯 Processing first ${limit} prompts...`)
    } else {
      console.log('🎯 Processing all prompts...')
    }
    
    await scraper.processAllPrompts(limit)
    
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  } finally {
    await scraper.cleanup()
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export default EnhancedUlazAIScraper 