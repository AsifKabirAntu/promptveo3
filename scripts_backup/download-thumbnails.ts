import fs from 'fs'
import path from 'path'
import axios from 'axios'

interface ScrapedPrompt {
  id: string
  title: string
  videoThumbnail?: string
  localVideoPath?: string
  localThumbnailPath?: string
}

class ThumbnailDownloader {
  private inputFile: string
  private outputDir: string
  private baseUrl: string = 'https://ulazai.com'

  constructor() {
    this.inputFile = path.join(process.cwd(), 'data', 'ulazai-with-videos.json')
    this.outputDir = path.join(process.cwd(), 'data', 'ulazai-thumbnails')
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
      console.log(`📁 Created thumbnails directory: ${this.outputDir}`)
    }
  }

  private async downloadThumbnail(url: string, filename: string): Promise<boolean> {
    try {
      // Handle relative URLs
      const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`
      
      console.log(`🖼️  Downloading thumbnail: ${filename}`)
      
      const response = await axios.get(fullUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      })

      const outputPath = path.join(this.outputDir, filename)
      fs.writeFileSync(outputPath, response.data)
      
      const sizeKB = (response.data.length / 1024).toFixed(1)
      console.log(`✅ Downloaded: ${filename} (${sizeKB}KB)`)
      
      return true
    } catch (error) {
      console.error(`❌ Failed to download ${filename}:`, error)
      return false
    }
  }

  private getFilenameFromUrl(url: string, promptId: string): string {
    try {
      // Extract extension from URL
      const urlPath = new URL(url.startsWith('http') ? url : `${this.baseUrl}${url}`).pathname
      const extension = path.extname(urlPath) || '.jpg'
      
      // Create safe filename using prompt ID
      return `${promptId}-thumbnail${extension}`
    } catch {
      return `${promptId}-thumbnail.jpg`
    }
  }

  async downloadAllThumbnails(): Promise<void> {
    console.log('🖼️  Starting thumbnail download process...')
    console.log('=======================================')
    
    this.ensureOutputDirectory()

    // Load scraped data
    if (!fs.existsSync(this.inputFile)) {
      console.error(`❌ Input file not found: ${this.inputFile}`)
      return
    }

    const rawData = JSON.parse(fs.readFileSync(this.inputFile, 'utf8'))
    const scrapedData: ScrapedPrompt[] = rawData.prompts || rawData
    console.log(`📊 Found ${scrapedData.length} prompts to process`)

    let downloadedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (let i = 0; i < scrapedData.length; i++) {
      const prompt = scrapedData[i]
      
      if (!prompt.videoThumbnail) {
        console.log(`⏭️  Skipping ${i + 1}/${scrapedData.length}: No thumbnail URL`)
        skippedCount++
        continue
      }

      const filename = this.getFilenameFromUrl(prompt.videoThumbnail, prompt.id)
      const outputPath = path.join(this.outputDir, filename)

      // Skip if already exists
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  Skipping ${i + 1}/${scrapedData.length}: ${filename} already exists`)
        skippedCount++
        continue
      }

      console.log(`📥 Processing ${i + 1}/${scrapedData.length}: ${prompt.title.substring(0, 50)}...`)
      
      const success = await this.downloadThumbnail(prompt.videoThumbnail, filename)
      
      if (success) {
        downloadedCount++
        // Update the scraped data with local thumbnail path
        scrapedData[i].localThumbnailPath = filename
      } else {
        errorCount++
      }

      // Add delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Save updated data with local thumbnail paths
    const outputFile = path.join(process.cwd(), 'data', 'ulazai-with-videos-and-thumbnails.json')
    const outputData = rawData.prompts ? { ...rawData, prompts: scrapedData } : scrapedData
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2))

    console.log('\n🖼️  Thumbnail Download Complete!')
    console.log('================================')
    console.log(`📊 Total prompts: ${scrapedData.length}`)
    console.log(`✅ Downloaded: ${downloadedCount}`)
    console.log(`⏭️  Skipped: ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`💾 Updated data saved to: ${outputFile}`)
    
    if (downloadedCount > 0) {
      console.log(`\n📁 Thumbnails saved to: ${this.outputDir}`)
      console.log('🔄 Next: Update your ingestion script to use localThumbnailPath')
    }
  }
}

// CLI interface
async function main() {
  const downloader = new ThumbnailDownloader()
  await downloader.downloadAllThumbnails()
}

if (require.main === module) {
  main().catch(console.error)
}

export default ThumbnailDownloader 