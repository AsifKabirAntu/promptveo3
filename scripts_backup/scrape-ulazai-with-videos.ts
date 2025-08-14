import puppeteer, { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'
import youtubeDl from 'youtube-dl-exec'
import axios from 'axios'

interface VideoScrapedPrompt {
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
  localVideoPath?: string  // Path to downloaded video
  videoMetadata?: any      // Video metadata (duration, format, etc.)
  promptStructure?: any
  createdAt?: string
  updatedAt?: string
}

interface VideoScrapingResult {
  prompts: VideoScrapedPrompt[]
  totalProcessed: number
  totalSuccessful: number
  videosDownloaded: number
  scrapedAt: string
  errors: string[]
}

class UlazAIVideoScraper {
  private browser: Browser | null = null
  private delayMs = 5000 // 5 seconds between requests for video downloads
  private errors: string[] = []
  private videoDir: string

  constructor() {
    // Create videos directory
    this.videoDir = path.join(process.cwd(), 'data', 'ulazai-videos')
    if (!fs.existsSync(this.videoDir)) {
      fs.mkdirSync(this.videoDir, { recursive: true })
    }
  }

  async init() {
    console.log('🚀 Starting UlazAI Video Scraper...')
    this.browser = await puppeteer.launch({
      headless: true, // Changed to true - no more Chrome windows!
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

  // Enhanced video detection to find all possible video sources
  private async detectVideos(page: Page): Promise<{ videoUrl?: string, videoThumbnail?: string, videoMetadata?: any }> {
    try {
      const videoData = await page.evaluate(() => {
        const result: any = {}
        
        // Look for direct video elements
        const videos = document.querySelectorAll('video')
        if (videos.length > 0) {
          const video = videos[0] as HTMLVideoElement
          result.videoUrl = video.src || video.currentSrc
          result.videoThumbnail = video.poster
          result.videoMetadata = {
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            type: 'direct'
          }
        }
        
        // Look for iframe embeds (YouTube, Vimeo, etc.)
        if (!result.videoUrl) {
          const iframes = document.querySelectorAll('iframe')
          for (const iframe of iframes) {
            const src = (iframe as HTMLIFrameElement).src
            if (src && (
              src.includes('youtube.com') || 
              src.includes('youtu.be') ||
              src.includes('vimeo.com') ||
              src.includes('player.vimeo.com') ||
              src.includes('wistia.com') ||
              src.includes('jwplatform.com')
            )) {
              result.videoUrl = src
              result.videoMetadata = {
                type: 'embed',
                platform: src.includes('youtube') ? 'youtube' : 
                         src.includes('vimeo') ? 'vimeo' : 'other'
              }
              break
            }
          }
        }
        
        // Look for data attributes or JSON-LD that might contain video URLs
        if (!result.videoUrl) {
          const scripts = document.querySelectorAll('script[type="application/ld+json"]')
          for (const script of scripts) {
            try {
              const data = JSON.parse(script.textContent || '')
              if (data.contentUrl || data.embedUrl || (data['@type'] === 'VideoObject')) {
                result.videoUrl = data.contentUrl || data.embedUrl
                result.videoThumbnail = data.thumbnailUrl
                result.videoMetadata = {
                  type: 'structured-data',
                  name: data.name,
                  description: data.description,
                  duration: data.duration
                }
                break
              }
            } catch (e) {
              // Not JSON or no video data
            }
          }
        }
        
        // Look for any URLs in the page that might be video files
        if (!result.videoUrl) {
          const allLinks = document.querySelectorAll('a[href]')
          for (const link of allLinks) {
            const href = (link as HTMLAnchorElement).href
            if (href && (
              href.includes('.mp4') || 
              href.includes('.webm') || 
              href.includes('.mov') ||
              href.includes('.avi') ||
              href.includes('video') ||
              href.includes('player')
            )) {
              result.videoUrl = href
              result.videoMetadata = {
                type: 'direct-link'
              }
              break
            }
          }
        }
        
        return result
      })
      
      return videoData
    } catch (error) {
      console.error('Error detecting videos:', error)
      return {}
    }
  }

  // Download video from various sources
  private async downloadVideo(videoUrl: string, promptId: string, title: string): Promise<{ localPath?: string, metadata?: any }> {
    try {
      console.log(`🎥 Attempting to download video: ${videoUrl}`)
      
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').substring(0, 50)
      const baseFilename = `${promptId}-${sanitizedTitle}`.replace(/\s+/g, '-')
      
      // Try youtube-dl first (works for many platforms)
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || 
          videoUrl.includes('vimeo.com') || videoUrl.includes('player.vimeo.com') ||
          !videoUrl.includes('.mp4')) {
        
        try {
          console.log('📹 Using youtube-dl for download...')
          
          const outputPath = path.join(this.videoDir, `${baseFilename}.%(ext)s`)
          
          const info = await youtubeDl(videoUrl, {
            output: outputPath,
            format: 'best[ext=mp4]/best',
            writeInfoJson: true,
            writeDescription: true,
            writeThumbnail: true,
            noWarnings: true,
            maxFilesize: '100M' // Limit to 100MB
          })
          
          // Find the actual downloaded file
          const files = fs.readdirSync(this.videoDir)
          const videoFile = files.find(f => f.startsWith(baseFilename) && (f.endsWith('.mp4') || f.endsWith('.webm')))
          const infoFile = files.find(f => f.startsWith(baseFilename) && f.endsWith('.info.json'))
          
          let metadata = {}
          if (infoFile) {
            try {
              const infoPath = path.join(this.videoDir, infoFile)
              metadata = JSON.parse(fs.readFileSync(infoPath, 'utf8'))
            } catch (e) {
              console.log('Could not read video metadata')
            }
          }
          
          if (videoFile) {
            const localPath = path.join(this.videoDir, videoFile)
            console.log(`✅ Video downloaded: ${videoFile}`)
            return { localPath, metadata }
          }
          
        } catch (dlError) {
          console.log(`⚠️  youtube-dl failed: ${dlError}`)
        }
      }
      
      // Fallback: try direct HTTP download for .mp4 files
      if (videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.mov')) {
        try {
          console.log('🌐 Trying direct HTTP download...')
          
          const response = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream',
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          })
          
          const extension = videoUrl.includes('.webm') ? '.webm' : 
                          videoUrl.includes('.mov') ? '.mov' : '.mp4'
          const filename = `${baseFilename}${extension}`
          const localPath = path.join(this.videoDir, filename)
          
          const writer = fs.createWriteStream(localPath)
          response.data.pipe(writer)
          
          await new Promise<void>((resolve, reject) => {
            writer.on('finish', () => resolve())
            writer.on('error', reject)
          })
          
          const stats = fs.statSync(localPath)
          console.log(`✅ Direct download complete: ${filename} (${Math.round(stats.size / 1024 / 1024)}MB)`)
          
          return { 
            localPath, 
            metadata: { 
              size: stats.size,
              downloadMethod: 'direct',
              originalUrl: videoUrl 
            } 
          }
          
        } catch (httpError) {
          console.log(`⚠️  Direct download failed: ${httpError}`)
        }
      }
      
      console.log(`❌ Could not download video from: ${videoUrl}`)
      return {}
      
    } catch (error) {
      console.error(`❌ Video download error for ${videoUrl}:`, error)
      this.errors.push(`Video download failed for ${promptId}: ${error}`)
      return {}
    }
  }

  // Main scraping function with video downloads
  async scrapePromptsWithVideos(maxPrompts: number = 10): Promise<VideoScrapingResult> {
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
      console.log(`🎯 Will process up to ${Math.min(maxPrompts, validPrompts.length)} prompts for video extraction`)
      
      if (validPrompts.length === 0) {
        throw new Error('No valid prompt URLs found in basic data')
      }

      const promptsToProcess = validPrompts.slice(0, maxPrompts)
      const videoPrompts: VideoScrapedPrompt[] = []
      let videosDownloaded = 0

      for (let i = 0; i < promptsToProcess.length; i++) {
        const basicPrompt = promptsToProcess[i]
        console.log(`\n📄 Processing ${i + 1}/${promptsToProcess.length}: ${basicPrompt.title.substring(0, 50)}...`)
        
        const videoPrompt = await this.extractContentWithVideo(basicPrompt)
        if (videoPrompt) {
          videoPrompts.push(videoPrompt)
          if (videoPrompt.localVideoPath) {
            videosDownloaded++
            console.log(`🎬 Video downloaded: ${path.basename(videoPrompt.localVideoPath)}`)
          }
        }
        
        // Longer delay for video processing
        if (i < promptsToProcess.length - 1) {
          console.log(`⏳ Waiting ${this.delayMs}ms...`)
          await this.waitDelay(this.delayMs)
        }
      }

      console.log(`\n📊 Creating metadata file with all prompt and video information...`)
      
      // Create comprehensive metadata
      const metadata = {
        totalPrompts: videoPrompts.length,
        videosFound: videoPrompts.filter(p => p.videoUrl).length,
        videosDownloaded: videosDownloaded,
        downloadSuccessRate: Math.round((videosDownloaded / videoPrompts.filter(p => p.videoUrl).length) * 100) || 0,
        promptsByCategory: this.groupBy(videoPrompts, 'category'),
        promptsByAuthor: this.groupBy(videoPrompts, 'author'),
        videoFormats: this.getVideoFormats(videoPrompts),
        averagePromptLength: Math.round(
          videoPrompts.reduce((sum, p) => sum + p.fullPromptText.length, 0) / videoPrompts.length
        ),
        scrapedAt: new Date().toISOString(),
        errors: this.errors
      }

      return {
        prompts: videoPrompts,
        totalProcessed: promptsToProcess.length,
        totalSuccessful: videoPrompts.length,
        videosDownloaded: videosDownloaded,
        scrapedAt: new Date().toISOString(),
        errors: this.errors
      }

    } catch (error) {
      console.error('❌ Video scraping error:', error)
      return {
        prompts: [],
        totalProcessed: 0,
        totalSuccessful: 0,
        videosDownloaded: 0,
        scrapedAt: new Date().toISOString(),
        errors: [...this.errors, `Fatal: ${error}`]
      }
    }
  }

  private async extractContentWithVideo(basicPrompt: any): Promise<VideoScrapedPrompt | null> {
    if (!this.browser) throw new Error('Browser not initialized')

    const page = await this.browser.newPage()
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      
      console.log(`🔍 Visiting: ${basicPrompt.url}`)
      
      await page.goto(basicPrompt.url, { 
        waitUntil: 'networkidle2', 
        timeout: 60000 
      })
      
      await this.waitDelay(3000) // Wait for any dynamic content
      
      // Extract prompt content (same as before)
      const contentData = await page.evaluate((basic) => {
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
        
        // Extract full prompt text
        const promptSelectors = [
          'pre', 'code', '.prompt-content', '.code-block', '.json-content', '[data-prompt]', '.prompt-text'
        ]
        
        for (const selector of promptSelectors) {
          const elements = document.querySelectorAll(selector)
          for (const el of elements) {
            const text = el.textContent?.trim() || ''
            if (text.length > 50 && (
              text.includes('{') || text.includes('duration:') || text.includes('scene:') ||
              text.includes('prompt:') || text.includes('description:') || text.includes('task:')
            )) {
              result.fullPromptText = text
              break
            }
          }
          if (result.fullPromptText) break
        }
        
        // Fallback for prompt text
        if (!result.fullPromptText) {
          const paragraphs = document.querySelectorAll('p, div')
          for (const p of paragraphs) {
            const text = p.textContent?.trim() || ''
            if (text.length > 100 && !text.includes('UlazAI') && 
                (text.includes('video') || text.includes('shot') || text.includes('scene'))) {
              result.fullPromptText = text
              break
            }
          }
        }
        
        // Extract author
        const allText = document.body.textContent || ''
        const byMatches = allText.match(/by\s+([A-Za-z\s]+?)(?:\s|$|\n|,)/gi)
        if (byMatches && byMatches.length > 0) {
          const author = byMatches[0].replace(/^by\s+/i, '').trim()
          if (author.length > 0 && author.length < 50) {
            result.author = author
          }
        }
        
        return result
      }, basicPrompt)
      
      // Detect and download videos
      const videoData = await this.detectVideos(page)
      
      const videoPrompt: VideoScrapedPrompt = {
        ...contentData,
        fullPromptText: contentData.fullPromptText || contentData.description || contentData.title,
        videoUrl: videoData.videoUrl,
        videoThumbnail: videoData.videoThumbnail,
        videoMetadata: videoData.videoMetadata
      }
      
      // Try to parse JSON structure
      if (videoPrompt.fullPromptText) {
        try {
          const jsonMatch = videoPrompt.fullPromptText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            videoPrompt.promptStructure = JSON.parse(jsonMatch[0])
          }
        } catch (e) {
          // Not JSON, that's fine
        }
      }
      
      // Download video if found
      if (videoData.videoUrl) {
        console.log(`🎥 Found video: ${videoData.videoUrl}`)
        const downloadResult = await this.downloadVideo(
          videoData.videoUrl, 
          basicPrompt.id, 
          basicPrompt.title
        )
        
        if (downloadResult.localPath) {
          videoPrompt.localVideoPath = downloadResult.localPath
          videoPrompt.videoMetadata = { 
            ...videoPrompt.videoMetadata, 
            ...downloadResult.metadata 
          }
        }
      } else {
        console.log(`📹 No video found for: ${basicPrompt.title}`)
      }
      
      return videoPrompt
      
    } catch (error) {
      console.error(`❌ Error extracting from ${basicPrompt.url}:`, error)
      this.errors.push(`${basicPrompt.url}: ${error}`)
      return null
    } finally {
      await page.close()
    }
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((result, item) => {
      const group = item[key] || 'Unknown'
      result[group] = (result[group] || 0) + 1
      return result
    }, {})
  }

  private getVideoFormats(prompts: VideoScrapedPrompt[]): Record<string, number> {
    const formats: Record<string, number> = {}
    prompts.forEach(prompt => {
      if (prompt.localVideoPath) {
        const ext = path.extname(prompt.localVideoPath).toLowerCase()
        formats[ext] = (formats[ext] || 0) + 1
      }
    })
    return formats
  }
}

async function main() {
  const scraper = new UlazAIVideoScraper()
  
  try {
    await scraper.init()
    
    const maxPrompts = parseInt(process.argv[2]) || 10
    console.log(`🚀 Starting video extraction for up to ${maxPrompts} prompts...`)
    console.log(`📁 Videos will be saved to: data/ulazai-videos/`)
    
    const result = await scraper.scrapePromptsWithVideos(maxPrompts)
    
    console.log('\n📊 Video Scraping Results:')
    console.log(`   Total processed: ${result.totalProcessed}`)
    console.log(`   Successful extractions: ${result.totalSuccessful}`)
    console.log(`   Videos downloaded: ${result.videosDownloaded}`)
    console.log(`   Download success rate: ${Math.round((result.videosDownloaded / result.totalProcessed) * 100)}%`)
    console.log(`   Errors: ${result.errors.length}`)
    
    if (result.prompts.length > 0) {
      // Save results with video data
      const outputPath = path.join(process.cwd(), 'data', 'ulazai-with-videos.json')
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
      console.log(`💾 Saved ${result.prompts.length} prompts with video data to ${outputPath}`)
      
      // Show statistics
      const withVideos = result.prompts.filter(p => p.videoUrl)
      const withDownloadedVideos = result.prompts.filter(p => p.localVideoPath)
      const withFullText = result.prompts.filter(p => p.fullPromptText.length > 50)
      const withStructure = result.prompts.filter(p => p.promptStructure)
      
      console.log('\n📈 Content Quality:')
      console.log(`   Prompts with video URLs: ${withVideos.length}/${result.prompts.length}`)
      console.log(`   Videos successfully downloaded: ${withDownloadedVideos.length}/${withVideos.length}`)
      console.log(`   Prompts with substantial text: ${withFullText.length}/${result.prompts.length}`)
      console.log(`   Prompts with JSON structure: ${withStructure.length}/${result.prompts.length}`)
      
      // Show video file info
      if (withDownloadedVideos.length > 0) {
        console.log('\n🎬 Downloaded Videos:')
        withDownloadedVideos.slice(0, 5).forEach((prompt, i) => {
          const filename = path.basename(prompt.localVideoPath!)
          const size = fs.existsSync(prompt.localVideoPath!) ? 
            Math.round(fs.statSync(prompt.localVideoPath!).size / 1024 / 1024) : 0
          console.log(`   ${i + 1}. ${filename} (${size}MB) - "${prompt.title.substring(0, 40)}..."`)
        })
      }
      
      // Create comprehensive summary
      const summary = {
        totalProcessed: result.totalProcessed,
        totalSuccessful: result.totalSuccessful,
        videosDownloaded: result.videosDownloaded,
        downloadSuccessRate: Math.round((result.videosDownloaded / result.totalProcessed) * 100),
        contentQuality: {
          withVideos: withVideos.length,
          withDownloadedVideos: withDownloadedVideos.length,
          withFullText: withFullText.length,
          withStructure: withStructure.length
        },
        categories: [...new Set(result.prompts.map(p => p.category))],
        authors: [...new Set(result.prompts.map(p => p.author).filter(a => a !== 'Unknown'))],
        videoDirectory: path.resolve('data/ulazai-videos'),
        errors: result.errors
      }
      
      const summaryPath = path.join(process.cwd(), 'data', 'ulazai-video-summary.json')
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
      console.log(`📋 Summary saved to ${summaryPath}`)
      
    } else {
      console.log('⚠️  No content was successfully extracted.')
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

export { UlazAIVideoScraper, type VideoScrapedPrompt, type VideoScrapingResult } 