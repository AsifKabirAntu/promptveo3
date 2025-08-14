import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

interface IntelligentRemovalConfig {
  inputDir: string
  outputDir: string
  targetText: string
  brandText: string
  brandStyle: {
    fontsize: number
    fontcolor: string
    background: string
    padding: number
  }
}

class IntelligentWatermarkRemover {
  private config: IntelligentRemovalConfig

  constructor() {
    this.config = {
      inputDir: path.join(process.cwd(), 'data', 'ulazai-videos'),
      outputDir: path.join(process.cwd(), 'data', 'promptveo3-intelligent-branded'),
      targetText: 'ulazai.com',
      brandText: 'promptveo3.com',
      brandStyle: {
        fontsize: 20,
        fontcolor: 'white',
        background: '#2563eb@0.95',
        padding: 12
      }
    }
  }

  private ensureFFmpegInstalled(): boolean {
    try {
      execSync('ffmpeg -version', { stdio: 'pipe' })
      return true
    } catch (error) {
      console.error('❌ FFmpeg not found. Please install FFmpeg first.')
      return false
    }
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true })
      console.log(`📁 Created output directory: ${this.config.outputDir}`)
    }
  }

  private analyzeVideoAspectRatio(inputPath: string): { width: number, height: number, aspectRatio: string } {
    try {
      const result = execSync(`ffprobe -v quiet -print_format json -show_streams "${inputPath}"`, { encoding: 'utf8' })
      const data = JSON.parse(result)
      const videoStream = data.streams.find((stream: any) => stream.codec_type === 'video')
      
      if (videoStream) {
        const width = parseInt(videoStream.width)
        const height = parseInt(videoStream.height)
        const aspectRatio = width > height ? '16:9' : '9:16'
        
        console.log(`📐 Video dimensions: ${width}x${height} (${aspectRatio})`)
        return { width, height, aspectRatio }
      }
    } catch (error) {
      console.error('⚠️  Could not analyze video dimensions:', error)
    }
    
    return { width: 1280, height: 720, aspectRatio: '16:9' }
  }

  private generateIntelligentFilters(videoInfo: { width: number, height: number, aspectRatio: string }): string {
    const { width, height, aspectRatio } = videoInfo
    const { brandText, brandStyle } = this.config

    // Create multiple potential watermark removal areas based on common positions
    // Ensure positions are within frame bounds
    const margin = 10
    const logoWidth = Math.min(150, width - 20)
    const logoHeight = Math.min(50, height / 10)
    
    const commonPositions = [
      // Bottom left (most common)
      { x: margin, y: Math.max(0, height - logoHeight - margin), w: logoWidth, h: logoHeight, desc: 'bottom-left' },
      // Bottom right
      { x: Math.max(0, width - logoWidth - margin), y: Math.max(0, height - logoHeight - margin), w: logoWidth, h: logoHeight, desc: 'bottom-right' },
      // Bottom center
      { x: Math.max(0, (width - logoWidth) / 2), y: Math.max(0, height - logoHeight - margin), w: logoWidth, h: logoHeight, desc: 'bottom-center' },
      // Top left
      { x: margin, y: margin, w: logoWidth, h: logoHeight, desc: 'top-left' },
      // Top right
      { x: Math.max(0, width - logoWidth - margin), y: margin, w: logoWidth, h: logoHeight, desc: 'top-right' },
    ]

    // For vertical videos (9:16), adjust positions
    if (aspectRatio === '9:16') {
      const verticalLogoWidth = Math.min(width - 20, 200)
      commonPositions.push(
        // Middle positions for vertical videos
        { x: Math.max(0, (width - verticalLogoWidth) / 2), y: Math.max(0, height / 2 - logoHeight / 2), w: verticalLogoWidth, h: logoHeight, desc: 'middle-center' },
        { x: Math.max(0, (width - verticalLogoWidth) / 2), y: Math.max(0, height * 0.8 - logoHeight / 2), w: verticalLogoWidth, h: logoHeight, desc: 'lower-center' }
      )
    }

    // Generate delogo filters for each potential position
    const delogoFilters = commonPositions.map((pos, index) => 
      `delogo=x=${pos.x}:y=${pos.y}:w=${pos.w}:h=${pos.h}:show=0`
    ).join(',')

    // Position our brand watermark intelligently based on aspect ratio
    let brandPosition
    if (aspectRatio === '9:16') {
      // For vertical videos, place at bottom center
      brandPosition = `x=(w-text_w)/2:y=h-${brandStyle.fontsize + brandStyle.padding * 2 + 10}`
    } else {
      // For horizontal videos, place at bottom left
      brandPosition = `x=10:y=h-${brandStyle.fontsize + brandStyle.padding * 2 + 10}`
    }

    // Combine delogo and brand overlay
    const brandOverlay = `drawtext=text='${brandText}':fontsize=${brandStyle.fontsize}:fontcolor=${brandStyle.fontcolor}:${brandPosition}:box=1:boxcolor=${brandStyle.background}:boxborderw=${brandStyle.padding}:fontfile=/System/Library/Fonts/Helvetica.ttc`

    return `${delogoFilters},${brandOverlay}`
  }

  private processVideoIntelligently(inputPath: string, outputPath: string): boolean {
    try {
      console.log(`🔍 Analyzing video: ${path.basename(inputPath)}`)
      
      // Get video information
      const videoInfo = this.analyzeVideoAspectRatio(inputPath)
      
      // Generate intelligent filters
      const filters = this.generateIntelligentFilters(videoInfo)
      
      console.log(`🎨 Applying intelligent watermark removal for ${videoInfo.aspectRatio} video...`)
      
      // FFmpeg command with intelligent filtering
      const command = [
        'ffmpeg',
        '-i', `"${inputPath}"`,
        '-vf', `"${filters}"`,
        '-c:a', 'copy', // Keep audio unchanged
        '-c:v', 'libx264', // Re-encode video
        '-preset', 'fast', // Balance quality vs speed
        '-crf', '18', // High quality
        '-y', // Overwrite output file
        `"${outputPath}"`
      ].join(' ')

      console.log(`🎬 Processing with intelligent removal...`)
      execSync(command, { stdio: 'pipe' })
      
      // Verify output file
      if (fs.existsSync(outputPath)) {
        const inputSize = fs.statSync(inputPath).size
        const outputSize = fs.statSync(outputPath).size
        const sizeMB = (outputSize / (1024 * 1024)).toFixed(1)
        
        if (outputSize > inputSize * 0.3) { // Reasonable size check
          console.log(`✅ Intelligent branding complete: ${path.basename(outputPath)} (${sizeMB}MB)`)
          return true
        } else {
          console.log(`⚠️  Warning: Output file seems too small: ${path.basename(outputPath)}`)
          return false
        }
      }
      
      return false
    } catch (error) {
      console.error(`❌ Error processing ${path.basename(inputPath)}:`, error)
      return false
    }
  }

  async processVideos(limit?: number): Promise<void> {
    if (!this.ensureFFmpegInstalled()) {
      return
    }

    this.ensureOutputDir()

    console.log('🧠 Intelligent Watermark Removal & Branding')
    console.log('==========================================')
    console.log(`📂 Input: ${this.config.inputDir}`)
    console.log(`📂 Output: ${this.config.outputDir}`)
    console.log(`🎯 Target: Remove "${this.config.targetText}" watermarks`)
    console.log(`🏷️  Brand: Add "${this.config.brandText}" watermark`)
    console.log()

    const videoFiles = fs.readdirSync(this.config.inputDir)
      .filter(file => file.endsWith('.mp4'))

    if (limit) {
      videoFiles.splice(limit)
    }

    if (videoFiles.length === 0) {
      console.log('❌ No MP4 files found in input directory')
      return
    }

    console.log(`🎬 Found ${videoFiles.length} videos to process`)
    
    let processed = 0
    let successful = 0
    let failed = 0
    let skipped = 0

    for (const videoFile of videoFiles) {
      processed++
      
      const inputPath = path.join(this.config.inputDir, videoFile)
      const outputFileName = videoFile.replace('.mp4', '-intelligent.mp4')
      const outputPath = path.join(this.config.outputDir, outputFileName)

      // Skip if already processed
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  Skipping ${videoFile} (already processed)`)
        skipped++
        continue
      }

      console.log(`\n🎬 Processing ${processed}/${videoFiles.length}: ${videoFile}`)
      
      const success = this.processVideoIntelligently(inputPath, outputPath)
      
      if (success) {
        successful++
      } else {
        failed++
      }

      // Small delay to prevent overwhelming the system
      if (processed < videoFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('\n🧠 Intelligent Processing Complete!')
    console.log('==================================')
    console.log(`📊 Total processed: ${processed}`)
    console.log(`✅ Successful: ${successful}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`📁 Intelligently branded videos saved to: ${this.config.outputDir}`)
    console.log(`\n🎯 Features:`)
    console.log(`   • Automatic aspect ratio detection`)
    console.log(`   • Multi-position watermark removal`)
    console.log(`   • Intelligent brand placement`)
    console.log(`   • Works with 16:9, 9:16, and other ratios`)
  }
}

// Main execution
async function main() {
  const remover = new IntelligentWatermarkRemover()
  
  // Get limit from command line args (default to 10 for testing)
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 10
  
  await remover.processVideos(limit)
}

// Export for use in other scripts
export default IntelligentWatermarkRemover

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
} 