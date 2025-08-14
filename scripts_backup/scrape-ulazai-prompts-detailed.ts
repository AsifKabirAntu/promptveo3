import puppeteer, { Browser, Page } from 'puppeteer'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'

interface DetailedScrapedPrompt {
  title: string
  author: string
  authorProfile?: string  // Link to creator's profile
  category: string
  description: string  // Short description from listing
  fullPromptText: string  // The actual detailed Veo 3 prompt
  tags: string[]
  views?: number
  likes?: number
  comments?: number
  difficulty?: string
  url: string
  id: string
  videoUrl?: string  // Video example if available
  videoThumbnail?: string  // Video thumbnail
  promptStructure?: any  // Structured prompt data (JSON format)
  createdAt?: string
  updatedAt?: string
}

interface PromptListItem {
  title: string
  url: string
  id: string
  category?: string
  author?: string
}

interface DetailedScrapingResult {
  prompts: DetailedScrapedPrompt[]
  totalPages: number
  totalPrompts: number
  scrapedAt: string
  errors: string[]
}

class DetailedUlazAIScraper {
  private browser: Browser | null = null
  private baseUrl = 'https://ulazai.com/directory/'
  private delayMs = 3000 // 3 seconds between requests to be very respectful
  private errors: string[] = []

  async init() {
    console.log('🚀 Starting Detailed UlazAI scraper...')
    this.browser = await puppeteer.launch({
      headless: false, // Use headful for debugging
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--allow-running-insecure-content'
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

  // Step 1: Get all prompt URLs from directory pages
  async getPromptUrls(): Promise<PromptListItem[]> {
    if (!this.browser) throw new Error('Browser not initialized')

    const allPromptUrls: PromptListItem[] = []
    let currentPage = 1
    let hasNextPage = true

    while (hasNextPage && currentPage <= 25) { // Safety limit
      const page = await this.browser.newPage()
      
      try {
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        const url = currentPage === 1 ? this.baseUrl : `${this.baseUrl}?page=${currentPage}`
        console.log(`📄 Scanning page ${currentPage}: ${url}`)
        
        await page.goto(url, { 
          waitUntil: 'networkidle0', 
          timeout: 60000 
        })
        
        // Wait for content to load
        try {
          await page.waitForSelector('a[href*="/directory/prompt/"], .prompt-card, .grid', { timeout: 15000 })
        } catch (e) {
          console.log(`⚠️  No prompt cards found on page ${currentPage}`)
          break
        }
        
                 // Extract prompt URLs from this page
         const pagePrompts = await page.evaluate(() => {
           const prompts: PromptListItem[] = []
           
           // First, look for the exact structure from the sample data we saw
           // Based on the previous scraper results, we know prompts have URLs like:
           // https://ulazai.com/directory/prompt/8203c10b-e173-4413-999e-fa0c9dbfc50e/
           
           // Look for all links that might lead to prompts
           const allLinks = document.querySelectorAll('a[href]')
           
           for (const link of allLinks) {
             const href = (link as HTMLAnchorElement).href
             
             // Check if this looks like a prompt URL
             if (href && href.includes('/directory/prompt/') && href.includes('-')) {
               // Extract title from the link text or nearby elements
               let title = link.textContent?.trim() || ''
               
               // If link has no text, look for title in parent elements
               if (!title || title.length < 5) {
                 const parent = link.closest('div, article, section')
                 if (parent) {
                   const titleEl = parent.querySelector('h1, h2, h3, h4, .title, strong')
                   if (titleEl) {
                     title = titleEl.textContent?.trim() || ''
                   }
                 }
               }
               
               // Extract ID from URL (should be UUID format)
               const urlParts = href.split('/')
               let id = ''
               for (const part of urlParts) {
                 if (part.includes('-') && part.length > 30) { // UUID-like
                   id = part
                   break
                 }
               }
               
               if (title.length > 5 && id && !prompts.find(p => p.id === id)) {
                 prompts.push({
                   title: title.substring(0, 100),
                   url: href,
                   id: id
                 })
               }
             }
           }
          
                     // Check for pagination - use more robust detection
           let hasNext = false
           const paginationSelectors = ['a', '.next', '[data-testid="next"]', '.pagination a', '.page-link']
           for (const sel of paginationSelectors) {
             const elements = document.querySelectorAll(sel)
             for (const el of elements) {
               const text = el.textContent?.toLowerCase() || ''
               if (text.includes('next') || text.includes('›') || text.includes('→')) {
                 hasNext = true
                 break
               }
             }
             if (hasNext) break
           }
          
          return { prompts, hasNext }
        })
        
        allPromptUrls.push(...pagePrompts.prompts)
        hasNextPage = pagePrompts.hasNext
        
        console.log(`✅ Found ${pagePrompts.prompts.length} prompt URLs on page ${currentPage} (Total: ${allPromptUrls.length})`)
        
        if (pagePrompts.prompts.length === 0) {
          console.log('🔍 No prompts found, trying alternative extraction...')
          // Take screenshot for debugging
          await page.screenshot({ path: `ulazai-page-${currentPage}-debug.png` })
        }
        
        currentPage++
        await this.waitDelay(this.delayMs)
        
      } catch (error) {
        console.error(`❌ Error on page ${currentPage}:`, error)
        this.errors.push(`Page ${currentPage}: ${error}`)
        break
      } finally {
        await page.close()
      }
    }

    // Remove duplicates
    const uniquePrompts = allPromptUrls.filter((prompt, index, self) => 
      index === self.findIndex(p => p.id === prompt.id)
    )

    console.log(`📊 Total unique prompt URLs collected: ${uniquePrompts.length}`)
    return uniquePrompts
  }

  // Step 2: Extract detailed data from individual prompt pages
  async scrapePromptDetails(promptUrl: PromptListItem): Promise<DetailedScrapedPrompt | null> {
    if (!this.browser) throw new Error('Browser not initialized')

    const page = await this.browser.newPage()
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      
      console.log(`🔍 Extracting: ${promptUrl.title.substring(0, 50)}...`)
      
      await page.goto(promptUrl.url, { 
        waitUntil: 'networkidle0', 
        timeout: 60000 
      })
      
      // Wait for content to load
      await page.waitForSelector('body', { timeout: 10000 })
      
      // Extract all the data from the prompt page
      const promptData = await page.evaluate((urlData) => {
        const result: any = {
          title: urlData.title,
          url: urlData.url,
          id: urlData.id,
          author: 'Unknown',
          category: 'Community',
          description: '',
          fullPromptText: '',
          tags: [],
          views: 0,
          likes: 0,
          comments: 0
        }
        
        // Extract title (try multiple selectors)
        const titleSelectors = ['h1', '.title', '[data-testid="title"]', '.prompt-title']
        for (const sel of titleSelectors) {
          const titleEl = document.querySelector(sel)
          if (titleEl?.textContent?.trim()) {
            result.title = titleEl.textContent.trim()
            break
          }
        }
        
                 // Extract author information
         const authorSelectors = ['.author', '[data-testid="author"]', '.creator', '.by-author', 'span', 'div', 'small']
         
         for (const sel of authorSelectors) {
           const authorEls = document.querySelectorAll(sel)
           for (const authorEl of authorEls) {
             const authorText = authorEl.textContent?.trim() || ''
             if (authorText.includes('by ') && authorText.length < 100) {
               let cleanAuthor = authorText.replace(/^by\s+/i, '').trim()
               if (cleanAuthor.length > 0 && cleanAuthor.length < 80) {
                 result.author = cleanAuthor
                 
                 // Try to find author profile link
                 const authorLink = authorEl.querySelector('a') || authorEl.closest('a')
                 if (authorLink) {
                   result.authorProfile = (authorLink as HTMLAnchorElement).href
                 }
                 break
               }
             }
           }
           if (result.author !== 'Unknown') break
         }
        
        // Extract category/tags
        const tagSelectors = ['.tag', '.badge', '.category', '[data-testid="category"]', '.chip']
        const tags: string[] = []
        
        for (const sel of tagSelectors) {
          const tagEls = document.querySelectorAll(sel)
          for (const tagEl of tagEls) {
            const tagText = tagEl.textContent?.trim()
            if (tagText && tagText.length > 0 && tagText.length < 30) {
              tags.push(tagText)
              if (tagText.includes('🎨') || tagText.includes('⚡') || tagText.includes('🧙')) {
                result.category = tagText
              }
            }
          }
        }
        result.tags = [...new Set(tags)] // Remove duplicates
        
        // Extract the main prompt content
        const promptSelectors = [
          'pre', 
          '.prompt-content', 
          '.code-block',
          '[data-testid="prompt"]',
          '.prompt-text',
          'code',
          '.json-content'
        ]
        
        for (const sel of promptSelectors) {
          const promptEl = document.querySelector(sel)
          if (promptEl?.textContent?.trim()) {
            result.fullPromptText = promptEl.textContent.trim()
            break
          }
        }
        
        // If no structured prompt found, look in paragraphs
        if (!result.fullPromptText) {
          const paragraphs = document.querySelectorAll('p')
          for (const p of paragraphs) {
            const text = p.textContent?.trim() || ''
            if (text.length > 50 && (
              text.includes('{') || 
              text.includes('duration:') || 
              text.includes('scene:') ||
              text.includes('prompt:') ||
              text.includes('description:')
            )) {
              result.fullPromptText = text
              break
            }
          }
        }
        
        // Extract description
        const descSelectors = ['.description', '.summary', '.excerpt', 'meta[name="description"]']
        for (const sel of descSelectors) {
          const descEl = document.querySelector(sel)
          if (descEl) {
            if (descEl.tagName === 'META') {
              result.description = (descEl as HTMLMetaElement).content
            } else {
              result.description = descEl.textContent?.trim() || ''
            }
            if (result.description) break
          }
        }
        
        // Extract stats (views, likes, comments)
        const statsText = document.body.textContent || ''
        const viewsMatch = statsText.match(/(\d+)\s*(?:views?|👁)/i)
        const likesMatch = statsText.match(/(\d+)\s*(?:likes?|❤️|♥️|👍)/i)
        const commentsMatch = statsText.match(/(\d+)\s*(?:comments?|💬)/i)
        
        if (viewsMatch) result.views = parseInt(viewsMatch[1])
        if (likesMatch) result.likes = parseInt(likesMatch[1])
        if (commentsMatch) result.comments = parseInt(commentsMatch[1])
        
        // Try to find video content
        const videos = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]')
        if (videos.length > 0) {
          const video = videos[0]
          if (video.tagName === 'VIDEO') {
            result.videoUrl = (video as HTMLVideoElement).src
            result.videoThumbnail = (video as HTMLVideoElement).poster
          } else if (video.tagName === 'IFRAME') {
            result.videoUrl = (video as HTMLIFrameElement).src
          }
        }
        
        // Try to parse JSON structure if the prompt looks like structured data
        if (result.fullPromptText && (result.fullPromptText.includes('{') || result.fullPromptText.includes('duration:'))) {
          try {
            // Try to extract JSON from the text
            const jsonMatch = result.fullPromptText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              result.promptStructure = JSON.parse(jsonMatch[0])
            }
          } catch (e) {
            // Not valid JSON, that's okay
          }
        }
        
        return result
      }, promptUrl)
      
      // If we didn't get the full prompt text, use the description
      if (!promptData.fullPromptText && promptData.description) {
        promptData.fullPromptText = promptData.description
      }
      
      // If still no content, use the title
      if (!promptData.fullPromptText) {
        promptData.fullPromptText = promptData.title
        console.log(`⚠️  No detailed prompt found for: ${promptData.title}`)
      }
      
      return promptData as DetailedScrapedPrompt
      
    } catch (error) {
      console.error(`❌ Error scraping ${promptUrl.url}:`, error)
      this.errors.push(`${promptUrl.url}: ${error}`)
      return null
    } finally {
      await page.close()
      await this.waitDelay(1000) // Small delay between individual pages
    }
  }

  // Main scraping function
  async scrapeAllDetailedPrompts(maxPrompts: number = 50): Promise<DetailedScrapingResult> {
    try {
      console.log('🔍 Step 1: Collecting prompt URLs from directory pages...')
      const promptUrls = await this.getPromptUrls()
      
      if (promptUrls.length === 0) {
        throw new Error('No prompt URLs found')
      }
      
      console.log(`\n🔍 Step 2: Extracting detailed content from ${Math.min(promptUrls.length, maxPrompts)} prompts...`)
      
      const detailedPrompts: DetailedScrapedPrompt[] = []
      const urlsToProcess = promptUrls.slice(0, maxPrompts) // Limit for initial testing
      
      for (let i = 0; i < urlsToProcess.length; i++) {
        const promptUrl = urlsToProcess[i]
        console.log(`📄 Processing ${i + 1}/${urlsToProcess.length}: ${promptUrl.title.substring(0, 40)}...`)
        
        const detailedPrompt = await this.scrapePromptDetails(promptUrl)
        if (detailedPrompt) {
          detailedPrompts.push(detailedPrompt)
          console.log(`✅ Extracted: "${detailedPrompt.title}" by ${detailedPrompt.author}`)
          
          // Show preview of extracted prompt
          if (detailedPrompt.fullPromptText.length > 100) {
            console.log(`   Prompt preview: ${detailedPrompt.fullPromptText.substring(0, 100)}...`)
          }
        }
        
        // Longer delay between detailed extractions
        if (i < urlsToProcess.length - 1) {
          await this.waitDelay(this.delayMs)
        }
      }
      
      return {
        prompts: detailedPrompts,
        totalPages: Math.ceil(promptUrls.length / 24), // Estimated based on typical pagination
        totalPrompts: detailedPrompts.length,
        scrapedAt: new Date().toISOString(),
        errors: this.errors
      }
      
    } catch (error) {
      console.error('❌ Fatal scraping error:', error)
      return {
        prompts: [],
        totalPages: 0,
        totalPrompts: 0,
        scrapedAt: new Date().toISOString(),
        errors: [...this.errors, `Fatal: ${error}`]
      }
    }
  }
}

async function main() {
  const scraper = new DetailedUlazAIScraper()
  
  try {
    await scraper.init()
    
    // Allow command line argument for number of prompts to scrape
    const maxPrompts = parseInt(process.argv[2]) || 50
    console.log(`🚀 Starting detailed scraping of up to ${maxPrompts} prompts...`)
    
    const result = await scraper.scrapeAllDetailedPrompts(maxPrompts)
    
    console.log('\n📊 Detailed Scraping Results:')
    console.log(`   Total prompts extracted: ${result.totalPrompts}`)
    console.log(`   Errors encountered: ${result.errors.length}`)
    console.log(`   Scraped at: ${result.scrapedAt}`)
    
    if (result.prompts.length > 0) {
      // Save detailed results
      const outputPath = path.join(process.cwd(), 'data', 'ulazai-detailed-prompts.json')
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
      console.log(`💾 Saved ${result.prompts.length} detailed prompts to ${outputPath}`)
      
      // Show sample detailed prompts
      console.log('\n📝 Sample detailed prompts:')
      result.prompts.slice(0, 3).forEach((prompt, i) => {
        console.log(`\n   ${i + 1}. "${prompt.title}"`)
        console.log(`      Author: ${prompt.author}`)
        console.log(`      Category: ${prompt.category}`)
        console.log(`      Tags: ${prompt.tags.join(', ')}`)
        console.log(`      Prompt length: ${prompt.fullPromptText.length} characters`)
        if (prompt.fullPromptText.length > 0) {
          console.log(`      Prompt preview: ${prompt.fullPromptText.substring(0, 150)}...`)
        }
      })
      
      // Create summary
      const summary = {
        total: result.totalPrompts,
        categories: [...new Set(result.prompts.map(p => p.category))],
        authors: [...new Set(result.prompts.map(p => p.author))],
        averagePromptLength: Math.round(result.prompts.reduce((sum, p) => sum + p.fullPromptText.length, 0) / result.prompts.length),
        promptsWithVideo: result.prompts.filter(p => p.videoUrl).length,
        promptsWithStructure: result.prompts.filter(p => p.promptStructure).length,
        errors: result.errors
      }
      
      const summaryPath = path.join(process.cwd(), 'data', 'ulazai-detailed-summary.json')
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
      console.log(`📋 Detailed summary saved to ${summaryPath}`)
      
    } else {
      console.log('⚠️  No detailed prompts were extracted.')
      if (result.errors.length > 0) {
        console.log('❌ Errors encountered:')
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

export { DetailedUlazAIScraper, type DetailedScrapedPrompt, type DetailedScrapingResult } 