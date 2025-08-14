import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface PromptToUpdate {
  id: string
  title: string
  source_url?: string
}

class TargetedPromptScraper {
  private browser: any = null
  private page: any = null

  async init() {
    console.log('🚀 Initializing targeted prompt scraper...')
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    this.page = await this.browser.newPage()
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
  }

  async extractCleanPromptFromPage(url: string): Promise<string | null> {
    try {
      console.log(`🔍 Visiting: ${url}`)
      await this.page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
      
      // Wait for content to load
      await this.page.waitForTimeout(2000)

      // Try multiple selectors to find the prompt content
      const cleanPrompt = await this.page.evaluate(() => {
        // Method 1: Look for prompt in structured content
        const promptSelectors = [
          '[data-testid="prompt-content"]',
          '.prompt-content',
          '.prompt-text',
          '[class*="prompt"]',
          'pre', // Often prompts are in <pre> tags
          'code', // Or <code> tags
        ]

        for (const selector of promptSelectors) {
          const element = document.querySelector(selector)
          if (element && element.textContent && element.textContent.trim().length > 50) {
            return element.textContent.trim()
          }
        }

        // Method 2: Look for JSON content
        const scripts = document.querySelectorAll('script')
        for (const script of scripts) {
          const content = script.textContent || ''
          if (content.includes('"video"') && content.includes('"scenes"')) {
            try {
              // Extract JSON from script
                             const jsonMatch = content.match(/\{[^}]*"video"[^}]*\}/)
              if (jsonMatch) {
                return JSON.stringify(JSON.parse(jsonMatch[0]), null, 2)
              }
            } catch (e) {
              // Continue searching
            }
          }
        }

        // Method 3: Look for text that looks like a prompt
        const textNodes = document.evaluate(
          "//text()[normalize-space(.) != '']",
          document,
          null,
          XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
          null
        )

        for (let i = 0; i < textNodes.snapshotLength; i++) {
          const node = textNodes.snapshotItem(i)
          const text = node?.textContent?.trim() || ''
          
          // Look for prompt-like content
          if (text.length > 100 && 
              (text.toLowerCase().includes('video') || 
               text.toLowerCase().includes('scene') ||
               text.toLowerCase().includes('camera') ||
               text.toLowerCase().includes('shot'))) {
            return text
          }
        }

        // Method 4: Get main content area
        const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.body
        const text = mainContent?.textContent?.trim() || ''
        
                 // Clean up common unwanted text
         const cleaned = text
           .replace(/Directory.*?Prompt/g, '')
           .replace(/🧙.*?UlazAI/g, '')
           .replace(/Login.*?Sign up/g, '')
           .replace(/Subscribe.*?Newsletter/g, '')
           .trim()

        return cleaned.length > 50 ? cleaned : null
      })

      return cleanPrompt
    } catch (error) {
      console.error(`❌ Error extracting from ${url}:`, error)
      return null
    }
  }

  async updatePromptInDatabase(promptId: string, cleanContent: string) {
    try {
      const { error } = await supabase
        .from('community_prompts')
        .update({
          veo3_prompt: cleanContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId)

      if (error) {
        console.error(`❌ Database update error for ${promptId}:`, error)
        return false
      }

      console.log(`✅ Updated prompt ${promptId}`)
      return true
    } catch (error) {
      console.error(`❌ Database error for ${promptId}:`, error)
      return false
    }
  }

  async processAllPrompts() {
    try {
      // Get all prompts that need updating (those without clean veo3_prompt)
      const { data: prompts, error } = await supabase
        .from('community_prompts')
        .select('id, title, source_url')
        .or('veo3_prompt.is.null,veo3_prompt.eq.')
        .limit(500)

      if (error) {
        console.error('❌ Error fetching prompts:', error)
        return
      }

      console.log(`📋 Found ${prompts.length} prompts to update`)

      let successCount = 0
      let failCount = 0

      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i]
        console.log(`\n📄 Processing ${i + 1}/${prompts.length}: ${prompt.title}`)

        // Construct URL if we have source_url, otherwise try to construct from ID
        let url = prompt.source_url
        if (!url) {
          url = `https://ulazai.com/directory/prompt/${prompt.id}/`
        }

        const cleanPrompt = await this.extractCleanPromptFromPage(url)
        
        if (cleanPrompt) {
          const success = await this.updatePromptInDatabase(prompt.id, cleanPrompt)
          if (success) {
            successCount++
          } else {
            failCount++
          }
        } else {
          console.log(`⚠️  No clean content found for: ${prompt.title}`)
          failCount++
        }

        // Rate limiting
        await this.page.waitForTimeout(2000)
      }

      console.log(`\n📊 Re-scraping Complete!`)
      console.log(`✅ Successfully updated: ${successCount}`)
      console.log(`❌ Failed: ${failCount}`)

    } catch (error) {
      console.error('❌ Error in processAllPrompts:', error)
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }
}

async function main() {
  const scraper = new TargetedPromptScraper()
  
  try {
    await scraper.init()
    await scraper.processAllPrompts()
  } catch (error) {
    console.error('❌ Fatal error:', error)
  } finally {
    await scraper.cleanup()
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export default TargetedPromptScraper 