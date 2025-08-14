import { createClient } from '@supabase/supabase-js'
import puppeteer, { Browser, Page } from 'puppeteer'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface DetailedPromptData {
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

class EnhancedDetailedScraper {
  private browser: Browser | null = null
  private page: Page | null = null
  private errors: string[] = []
  private processed = 0
  private updated = 0

  async init() {
    console.log('🚀 Starting enhanced detailed scraper...')
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    this.page = await this.browser.newPage()
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
  }

  async extractDetailedData(url: string): Promise<DetailedPromptData | null> {
    try {
      console.log(`🔍 Visiting: ${url}`)
      await this.page!.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
      await new Promise(resolve => setTimeout(resolve, 2000))

      const data = await this.page!.evaluate(() => {
        // Helper function to clean text
        const cleanText = (text: string) => {
          return text?.replace(/\s+/g, ' ').trim() || ''
        }

        // Extract title
        const titleElement = document.querySelector('h1') || 
                            document.querySelector('[class*="title"]') ||
                            document.querySelector('.prompt-title')
        const title = cleanText(titleElement?.textContent || '')

        // Extract creator information
        let creatorName = 'Unknown Creator'
        let creatorProfileUrl = ''
        
        // Look for creator links and names
        const creatorSelectors = [
          'a[href*="/user/"]',
          'a[href*="/creator/"]', 
          'a[href*="/profile/"]',
          '[class*="creator"] a',
          '[class*="author"] a',
          '.user-profile a'
        ]
        
        for (const selector of creatorSelectors) {
          const creatorElement = document.querySelector(selector)
          if (creatorElement) {
            creatorName = cleanText(creatorElement.textContent || creatorName)
            creatorProfileUrl = (creatorElement as HTMLAnchorElement).href || ''
            break
          }
        }

        // If no link found, look for creator name in text
        if (creatorName === 'Unknown Creator') {
          const creatorTextSelectors = [
            '[class*="creator"]',
            '[class*="author"]', 
            '[class*="user"]',
            '.by-author',
            '.created-by'
          ]
          
          for (const selector of creatorTextSelectors) {
            const element = document.querySelector(selector)
            if (element?.textContent) {
              const text = cleanText(element.textContent)
              if (text && !text.toLowerCase().includes('creator') && !text.toLowerCase().includes('by')) {
                creatorName = text
                break
              }
            }
          }
        }

        // Extract category
        let category = 'General'
        const categorySelectors = [
          '[class*="category"]',
          '[class*="tag"][class*="category"]',
          '.badge.category',
          '[data-category]'
        ]
        
        for (const selector of categorySelectors) {
          const categoryElement = document.querySelector(selector)
          if (categoryElement?.textContent) {
            category = cleanText(categoryElement.textContent)
            break
          }
        }

        // Extract difficulty level
        let difficultyLevel = undefined
        const difficultySelectors = [
          '[class*="difficulty"]',
          '[class*="level"]',
          '.badge.difficulty',
          '[data-difficulty]'
        ]
        
        for (const selector of difficultySelectors) {
          const difficultyElement = document.querySelector(selector)
          if (difficultyElement?.textContent) {
            const difficulty = cleanText(difficultyElement.textContent).toLowerCase()
            if (['beginner', 'intermediate', 'advanced', 'expert', 'easy', 'medium', 'hard'].some(level => 
                difficulty.includes(level))) {
              difficultyLevel = difficulty
              break
            }
          }
        }

        // Extract description - look for clean description text
        let description = ''
        const descriptionSelectors = [
          '.description',
          '[class*="description"]',
          '.prompt-description',
          'p[class*="desc"]',
          '.content p:first-of-type'
        ]
        
        for (const selector of descriptionSelectors) {
          const descElement = document.querySelector(selector)
          if (descElement?.textContent) {
            const text = cleanText(descElement.textContent)
            if (text.length > 20) { // Ensure it's substantial
              description = text
              break
            }
          }
        }

        // Extract Veo 3 prompt content
        let veo3Prompt = ''
        
        // Look for dedicated prompt sections
        const promptSelectors = [
          '[class*="prompt"][class*="content"]',
          '.veo-prompt',
          '.prompt-text',
          '[class*="prompt"][class*="box"]',
          'pre',
          'code',
          '[class*="code"]'
        ]
        
        for (const selector of promptSelectors) {
          const promptElement = document.querySelector(selector)
          if (promptElement?.textContent) {
            const text = cleanText(promptElement.textContent)
            if (text.length > 50) { // Ensure it's substantial
              veo3Prompt = text
              break
            }
          }
        }

        // If no dedicated prompt section, look for JSON-like content
        if (!veo3Prompt) {
          const allText = document.body.textContent || ''
          const jsonMatch = allText.match(/\{[^}]*["'](?:prompt|description|video)[^}]*\}/g)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0])
              if (parsed.prompt || parsed.description) {
                veo3Prompt = parsed.prompt || parsed.description
              }
            } catch (e) {
              // JSON parsing failed, continue
            }
          }
        }

        // Extract tags
        const tags: string[] = []
        const tagSelectors = [
          '.tag',
          '[class*="tag"]:not([class*="category"])',
          '.hashtag',
          '[data-tag]',
          '.badge:not(.category):not(.difficulty)'
        ]
        
        tagSelectors.forEach(selector => {
          const tagElements = document.querySelectorAll(selector)
          tagElements.forEach(tagElement => {
            const tagText = cleanText(tagElement.textContent || '')
            if (tagText && tagText.length > 0 && tagText.length < 30) {
              tags.push(tagText.replace(/^#/, '')) // Remove hashtag if present
            }
          })
        })

        // Remove duplicates and clean tags
        const uniqueTags = [...new Set(tags)].filter(tag => 
          tag.length > 1 && 
          !tag.toLowerCase().includes('category') &&
          !tag.toLowerCase().includes('difficulty')
        ).slice(0, 10) // Limit to 10 tags

        return {
          title: title || 'Untitled Prompt',
          creatorName,
          creatorProfileUrl: creatorProfileUrl || undefined,
          category: category || 'General',
          difficultyLevel,
          description: description || 'No description available',
          veo3Prompt: veo3Prompt || description || 'No prompt content found',
          extractedTags: uniqueTags
        }
      })

      return {
        url,
        title: data.title,
        clean_description: data.description,
        veo3_prompt: data.veo3Prompt,
        category: data.category,
        difficulty_level: data.difficultyLevel,
        creator_name: data.creatorName,
        creator_profile_url: data.creatorProfileUrl,
        extracted_tags: data.extractedTags
      }

    } catch (error) {
      console.error(`❌ Error extracting data from ${url}:`, error)
      this.errors.push(`${url}: ${error}`)
      return null
    }
  }

  async updateDatabase(promptId: string, data: DetailedPromptData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('community_prompts')
        .update({
          veo3_prompt: data.veo3_prompt,
          clean_description: data.clean_description,
          category: data.category,
          difficulty_level: data.difficulty_level,
          creator_name: data.creator_name,
          creator_profile_url: data.creator_profile_url,
          extracted_tags: data.extracted_tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId)

      if (error) {
        console.error(`❌ Database update error for ${promptId}:`, error)
        this.errors.push(`DB update ${promptId}: ${error.message}`)
        return false
      }

      console.log(`✅ Updated database for: ${data.title}`)
      return true
    } catch (error) {
      console.error(`❌ Database error for ${promptId}:`, error)
      this.errors.push(`DB error ${promptId}: ${error}`)
      return false
    }
  }

  async processPrompts(limit?: number) {
    console.log(`🎯 Processing ${limit ? `first ${limit}` : 'all'} prompts...`)
    
    try {
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

      // Process each prompt
      for (const [index, prompt] of prompts.entries()) {
        this.processed++
        console.log(`📄 Processing ${index + 1}/${prompts.length}: ${prompt.title}`)

        const extractedData = await this.extractDetailedData(prompt.source_url!)
        if (extractedData) {
          const success = await this.updateDatabase(prompt.id, extractedData)
          if (success) {
            this.updated++
            
            // Show extracted details
            console.log(`✅ Extracted details:`)
            console.log(`   Title: ${extractedData.title}`)
            console.log(`   Creator: ${extractedData.creator_name}`)
            console.log(`   Profile URL: ${extractedData.creator_profile_url || 'None'}`)
            console.log(`   Category: ${extractedData.category}`)
            console.log(`   Difficulty: ${extractedData.difficulty_level || 'None'}`)
            console.log(`   Tags: ${extractedData.extracted_tags.join(', ') || 'None'}`)
            console.log(`   Description: ${extractedData.clean_description.substring(0, 100)}...`)
            console.log(`   Prompt: ${extractedData.veo3_prompt.substring(0, 100)}...\n`)
          }
        }

        // Add delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      console.error('❌ Scraping failed:', error)
      this.errors.push(`General error: ${error}`)
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async run(limit?: number) {
    try {
      await this.init()
      await this.processPrompts(limit)
    } finally {
      await this.cleanup()
      
      console.log('\n🎉 Enhanced detailed scraping completed!')
      console.log('📊 Results:')
      console.log(`   Total processed: ${this.processed}`)
      console.log(`   Successfully updated: ${this.updated}`)
      console.log(`   Errors: ${this.errors.length}`)
      
      if (this.errors.length > 0) {
        console.log('\n❌ Errors encountered:')
        this.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`)
        })
      }
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const limit = args[0] ? parseInt(args[0]) : undefined
  
  const scraper = new EnhancedDetailedScraper()
  await scraper.run(limit)
}

if (require.main === module) {
  main().catch(console.error)
}

export default EnhancedDetailedScraper 