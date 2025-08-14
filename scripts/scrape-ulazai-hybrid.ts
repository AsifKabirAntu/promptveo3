import puppeteer, { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'

interface DetailedScrapedPrompt {
  title: string
  author: string
  authorProfile?: string
  category: string
  description: string
  fullPromptText: string
  tags: string[]
  views?: number
  likes?: number
  comments?: number
  difficulty?: string
  url: string
  id: string
  videoUrl?: string
  videoThumbnail?: string
  promptStructure?: any
  createdAt?: string
  updatedAt?: string
}

interface HybridScrapingResult {
  prompts: DetailedScrapedPrompt[]
  totalProcessed: number
  totalSuccessful: number
  scrapedAt: string
  errors: string[]
}

class UlazAIHybridScraper {
  private browser: Browser | null = null
  private delayMs = 4000 // 4 seconds between requests
  private errors: string[] = []

  async init() {
    console.log('🚀 Starting UlazAI Hybrid scraper...')
    this.browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security'
      ]
    })
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  private async waitDelay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Load existing scraped URLs and extract detailed content from them
  async scrapeDetailedFromExisting(maxPrompts: number = 10): Promise<HybridScrapingResult> {
    try {
      // Load the basic scraped data
      const basicDataPath = path.join(process.cwd(), 'data', 'ulazai-scraped-prompts.json')
      
      if (!fs.existsSync(basicDataPath)) {
        throw new Error('Basic scraped data not found. Please run "npm run scrape-ulazai" first.')
      }

      const basicData = JSON.parse(fs.readFileSync(basicDataPath, 'utf8'))
      const basicPrompts = basicData.prompts || []
      
      // Filter to only prompts with valid URLs
      const validPrompts = basicPrompts.filter((p: any) => 
        p.url && p.url.includes('/directory/prompt/') && p.id
      )
      
      console.log(`📊 Found ${validPrompts.length} prompts with URLs from basic scrape`)
      console.log(`🎯 Will process up to ${Math.min(maxPrompts, validPrompts.length)} prompts`)
      
      if (validPrompts.length === 0) {
        throw new Error('No valid prompt URLs found in basic data')
      }

      const promptsToProcess = validPrompts.slice(0, maxPrompts)
      const detailedPrompts: DetailedScrapedPrompt[] = []

      for (let i = 0; i < promptsToProcess.length; i++) {
        const basicPrompt = promptsToProcess[i]
        console.log(`\n📄 Processing ${i + 1}/${promptsToProcess.length}: ${basicPrompt.title.substring(0, 50)}...`)
        
        const detailedPrompt = await this.extractDetailedContent(basicPrompt)
        if (detailedPrompt) {
          detailedPrompts.push(detailedPrompt)
          console.log(`✅ Success: Found ${detailedPrompt.fullPromptText.length} chars of prompt text`)
          if (detailedPrompt.author !== 'Unknown') {
            console.log(`   👤 Author: ${detailedPrompt.author}`)
          }
          if (detailedPrompt.videoUrl) {
            console.log(`   🎥 Has video: ${detailedPrompt.videoUrl}`)
          }
        }
        
        // Delay between requests
        if (i < promptsToProcess.length - 1) {
          console.log(`⏳ Waiting ${this.delayMs}ms...`)
          await this.waitDelay(this.delayMs)
        }
      }

      return {
        prompts: detailedPrompts,
        totalProcessed: promptsToProcess.length,
        totalSuccessful: detailedPrompts.length,
        scrapedAt: new Date().toISOString(),
        errors: this.errors
      }

    } catch (error) {
      console.error('❌ Hybrid scraping error:', error)
      return {
        prompts: [],
        totalProcessed: 0,
        totalSuccessful: 0,
        scrapedAt: new Date().toISOString(),
        errors: [...this.errors, `Fatal: ${error}`]
      }
    }
  }

  async extractDetailedContent(basicPrompt: any): Promise<DetailedScrapedPrompt | null> {
    if (!this.browser) throw new Error('Browser not initialized')

    const page = await this.browser.newPage()
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      
      console.log(`🔍 Visiting: ${basicPrompt.url}`)
      
      await page.goto(basicPrompt.url, { 
        waitUntil: 'networkidle2', 
        timeout: 60000 
      })
      
             // Wait for content to load
       await this.waitDelay(2000)
      
      // Extract detailed data from the prompt page
      const detailedData = await page.evaluate((basic) => {
        const result: any = {
          title: basic.title,
          author: basic.author || 'Unknown',
          category: basic.category || 'Community',
          description: basic.content || '',
          fullPromptText: '',
          tags: basic.tags || [],
          views: basic.views || 0,
          likes: basic.likes || 0,
          comments: basic.comments || 0,
          url: basic.url,
          id: basic.id
        }
        
        // Try to find the actual prompt content in various locations
        const promptSelectors = [
          'pre',
          'code',
          '.prompt-content',
          '.code-block',
          '.json-content',
          '[data-prompt]',
          '.prompt-text'
        ]
        
        for (const selector of promptSelectors) {
          const elements = document.querySelectorAll(selector)
          for (const el of elements) {
            const text = el.textContent?.trim() || ''
            if (text.length > 50 && (
              text.includes('{') || 
              text.includes('duration:') ||
              text.includes('scene:') ||
              text.includes('prompt:') ||
              text.includes('description:') ||
              text.includes('task:') ||
              text.includes('subject:')
            )) {
              result.fullPromptText = text
              break
            }
          }
          if (result.fullPromptText) break
        }
        
        // If no structured prompt found, look for any large text blocks
        if (!result.fullPromptText) {
          const paragraphs = document.querySelectorAll('p, div')
          for (const p of paragraphs) {
            const text = p.textContent?.trim() || ''
            if (text.length > 100 && !text.includes('UlazAI') && !text.includes('directory')) {
              if (text.includes('video') || text.includes('shot') || text.includes('scene')) {
                result.fullPromptText = text
                break
              }
            }
          }
        }
        
        // Enhanced author extraction
        const allText = document.body.textContent || ''
        const byMatches = allText.match(/by\s+([A-Za-z\s]+?)(?:\s|$|\n|,)/gi)
        if (byMatches && byMatches.length > 0) {
          const author = byMatches[0].replace(/^by\s+/i, '').trim()
          if (author.length > 0 && author.length < 50 && !author.includes('Unknown')) {
            result.author = author
          }
        }
        
        // Try to find author profile links
        const authorLinks = document.querySelectorAll('a[href*="/profile/"], a[href*="/user/"], a[href*="/author/"]')
        if (authorLinks.length > 0) {
          result.authorProfile = (authorLinks[0] as HTMLAnchorElement).href
        }
        
        // Enhanced category extraction
        const categoryElements = document.querySelectorAll('.tag, .badge, .category, .chip')
        const categories: string[] = []
        for (const el of categoryElements) {
          const text = el.textContent?.trim() || ''
          if (text.length > 0 && text.length < 30) {
            categories.push(text)
          }
        }
        if (categories.length > 0) {
          result.category = categories[0]
          result.tags = [...new Set([...result.tags, ...categories])]
        }
        
        // Extract stats from page text
        const statsText = document.body.textContent || ''
        const viewsMatch = statsText.match(/(\d+)\s*(?:views?)/i)
        const likesMatch = statsText.match(/(\d+)\s*(?:likes?)/i)
        const commentsMatch = statsText.match(/(\d+)\s*(?:comments?)/i)
        
        if (viewsMatch) result.views = parseInt(viewsMatch[1])
        if (likesMatch) result.likes = parseInt(likesMatch[1])
        if (commentsMatch) result.comments = parseInt(commentsMatch[1])
        
        // Look for video content
        const videos = document.querySelectorAll('video[src], iframe[src*="youtube"], iframe[src*="vimeo"]')
        if (videos.length > 0) {
          const video = videos[0]
          if (video.tagName === 'VIDEO') {
            result.videoUrl = (video as HTMLVideoElement).src
          } else {
            result.videoUrl = (video as HTMLIFrameElement).src
          }
        }
        
        // Try to parse structured prompt data
        if (result.fullPromptText) {
          try {
            const jsonMatch = result.fullPromptText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              result.promptStructure = JSON.parse(jsonMatch[0])
            }
          } catch (e) {
            // Not JSON, that's fine
          }
        }
        
        return result
      }, basicPrompt)
      
      // Fallback: if we didn't get detailed prompt text, use what we have
      if (!detailedData.fullPromptText || detailedData.fullPromptText.length < 20) {
        detailedData.fullPromptText = detailedData.description || detailedData.title
        console.log(`⚠️  No detailed prompt found, using basic content`)
      }
      
      return detailedData as DetailedScrapedPrompt
      
    } catch (error) {
      console.error(`❌ Error extracting from ${basicPrompt.url}:`, error)
      this.errors.push(`${basicPrompt.url}: ${error}`)
      return null
    } finally {
      await page.close()
    }
  }
}

async function main() {
  const scraper = new UlazAIHybridScraper()
  
  try {
    await scraper.init()
    
    const maxPrompts = parseInt(process.argv[2]) || 20
    console.log(`🚀 Starting hybrid detailed extraction for up to ${maxPrompts} prompts...`)
    
    const result = await scraper.scrapeDetailedFromExisting(maxPrompts)
    
    console.log('\n📊 Hybrid Scraping Results:')
    console.log(`   Total processed: ${result.totalProcessed}`)
    console.log(`   Successful extractions: ${result.totalSuccessful}`)
    console.log(`   Success rate: ${Math.round((result.totalSuccessful / result.totalProcessed) * 100)}%`)
    console.log(`   Errors: ${result.errors.length}`)
    
    if (result.prompts.length > 0) {
      // Save detailed results
      const outputPath = path.join(process.cwd(), 'data', 'ulazai-hybrid-detailed.json')
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
      console.log(`💾 Saved ${result.prompts.length} detailed prompts to ${outputPath}`)
      
      // Show data quality
      const withFullText = result.prompts.filter(p => p.fullPromptText.length > 50)
      const withAuthors = result.prompts.filter(p => p.author !== 'Unknown')
      const withVideos = result.prompts.filter(p => p.videoUrl)
      const withStructure = result.prompts.filter(p => p.promptStructure)
      
      console.log('\n📈 Data Quality:')
      console.log(`   Prompts with substantial text: ${withFullText.length}/${result.prompts.length}`)
      console.log(`   Prompts with known authors: ${withAuthors.length}/${result.prompts.length}`)
      console.log(`   Prompts with videos: ${withVideos.length}/${result.prompts.length}`)
      console.log(`   Prompts with JSON structure: ${withStructure.length}/${result.prompts.length}`)
      
      // Show samples
      console.log('\n📝 Sample extracted prompts:')
      result.prompts.slice(0, 3).forEach((prompt, i) => {
        console.log(`\n   ${i + 1}. "${prompt.title}"`)
        console.log(`      Author: ${prompt.author}`)
        console.log(`      Category: ${prompt.category}`)
        console.log(`      Prompt length: ${prompt.fullPromptText.length} chars`)
        if (prompt.fullPromptText.length > 100) {
          console.log(`      Preview: ${prompt.fullPromptText.substring(0, 150)}...`)
        }
      })
      
      // Create summary
      const summary = {
        totalProcessed: result.totalProcessed,
        totalSuccessful: result.totalSuccessful,
        successRate: Math.round((result.totalSuccessful / result.totalProcessed) * 100),
        dataQuality: {
          withFullText: withFullText.length,
          withAuthors: withAuthors.length,
          withVideos: withVideos.length,
          withStructure: withStructure.length,
          averageTextLength: Math.round(
            result.prompts.reduce((sum, p) => sum + p.fullPromptText.length, 0) / result.prompts.length
          )
        },
        categories: [...new Set(result.prompts.map(p => p.category))],
        authors: [...new Set(result.prompts.map(p => p.author).filter(a => a !== 'Unknown'))],
        errors: result.errors
      }
      
      const summaryPath = path.join(process.cwd(), 'data', 'ulazai-hybrid-summary.json')
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
      console.log(`📋 Summary saved to ${summaryPath}`)
      
    } else {
      console.log('⚠️  No prompts were successfully extracted.')
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:')
        result.errors.forEach(error => console.log(`   - ${error}`))
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  } finally {
    await scraper.cleanup()
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { UlazAIHybridScraper, type DetailedScrapedPrompt, type HybridScrapingResult } 