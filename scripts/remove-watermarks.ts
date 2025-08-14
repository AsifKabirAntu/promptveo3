import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

interface WatermarkRemovalConfig {
  inputDir: string
  outputDir: string
  watermarkPositions: Array<{
    x: number
    y: number
    width: number
    height: number
    description: string
  }>
}

class WatermarkRemover {
  private config: WatermarkRemovalConfig

  constructor() {
    this.config = {
      inputDir: path.join(process.cwd(), 'data', 'ulazai-videos'),
      outputDir: path.join(process.cwd(), 'data', 'ulazai-videos-clean'),
      watermarkPositions: [
        // Specific "ulazai.com" watermark in bottom-left corner
        { x: 10, y: -40, width: 120, height: 30, description: 'bottom-left-ulazai' },
        // Additional positions to be thorough
        { x: 5, y: -45, width: 130, height: 35, description: 'bottom-left-wide' },
        { x: 15, y: -35, width: 100, height: 25, description: 'bottom-left-narrow' }
      ]
    }
  }

  private ensureFFmpegInstalled(): boolean {
    try {
      execSync('ffmpeg -version', { stdio: 'pipe' })
      return true
    } catch (error) {
      console.error('❌ FFmpeg not found. Please install FFmpeg:')
      console.error('   macOS: brew install ffmpeg')
      console.error('   Ubuntu: sudo apt install ffmpeg')
      console.error('   Windows: Download from https://ffmpeg.org/download.html')
      return false
    }
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true })
    }
  }

  private removeWatermark(inputPath: string, outputPath: string): boolean {
    try {
      console.log(`🧹 Processing: ${path.basename(inputPath)}`)
      
      // Get video info first
      const probeCmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${inputPath}"`
      const probeResult = execSync(probeCmd, { encoding: 'utf8' })
      const videoInfo = JSON.parse(probeResult)
      
      const videoStream = videoInfo.streams.find((s: any) => s.codec_type === 'video')
      if (!videoStream) {
        console.error(`❌ No video stream found in ${inputPath}`)
        return false
      }

      const width = videoStream.width
      const height = videoStream.height
      
      console.log(`   📐 Video dimensions: ${width}x${height}`)

      // Build FFmpeg filter to blur/remove watermark areas
      const filters: string[] = []
      
      // Try multiple watermark removal techniques
      
      // 1. Delogo filter (works well for static watermarks)
      // We'll target common watermark positions
      for (const pos of this.config.watermarkPositions) {
        let x = pos.x < 0 ? width + pos.x - pos.width : pos.x
        let y = pos.y < 0 ? height + pos.y - pos.height : pos.y
        
        // Ensure coordinates are within bounds
        x = Math.max(0, Math.min(x, width - pos.width))
        y = Math.max(0, Math.min(y, height - pos.height))
        
        // Use delogo filter to remove watermark
        filters.push(`delogo=x=${x}:y=${y}:w=${pos.width}:h=${pos.height}:show=0`)
      }

      // 2. Additional noise reduction and sharpening
      filters.push('hqdn3d=4:3:6:4.5') // Denoise
      filters.push('unsharp=5:5:0.8:3:3:0.4') // Sharpen

      const filterComplex = filters.join(',')
      
      // FFmpeg command with watermark removal
      const ffmpegCmd = [
        'ffmpeg',
        '-i', `"${inputPath}"`,
        '-vf', `"${filterComplex}"`,
        '-c:v', 'libx264',
        '-crf', '23',
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y', // Overwrite output
        `"${outputPath}"`
      ].join(' ')

      console.log(`   🔧 Running: ${ffmpegCmd.substring(0, 100)}...`)
      
      execSync(ffmpegCmd, { stdio: 'pipe' })
      
      // Check if output file was created and has reasonable size
      if (fs.existsSync(outputPath)) {
        const inputSize = fs.statSync(inputPath).size
        const outputSize = fs.statSync(outputPath).size
        
        if (outputSize > inputSize * 0.5) { // At least 50% of original size
          console.log(`   ✅ Success: ${(outputSize / 1024 / 1024).toFixed(1)}MB`)
          return true
        } else {
          console.log(`   ⚠️  Output too small, keeping original`)
          fs.unlinkSync(outputPath)
          return false
        }
      }
      
      return false
    } catch (error) {
      console.error(`   ❌ Error processing ${inputPath}:`, error)
      return false
    }
  }

  private async processVideos(): Promise<void> {
    const videoFiles = fs.readdirSync(this.config.inputDir)
      .filter(file => file.endsWith('.mp4'))
      .slice(0, 50) // Process 50 videos at a time

    console.log(`🎬 Found ${videoFiles.length} videos to process`)

    let successful = 0
    let failed = 0

    for (const file of videoFiles) {
      const inputPath = path.join(this.config.inputDir, file)
      const outputPath = path.join(this.config.outputDir, file.replace('.mp4', '-clean.mp4'))

      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  Skipping ${file} (already processed)`)
        successful++
        continue
      }

      if (this.removeWatermark(inputPath, outputPath)) {
        successful++
      } else {
        failed++
        // Copy original if watermark removal failed
        fs.copyFileSync(inputPath, outputPath.replace('-clean.mp4', '-original.mp4'))
      }

      // Small delay to prevent system overload
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`\n📊 Watermark Removal Results:`)
    console.log(`   ✅ Successful: ${successful}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📁 Clean videos saved to: ${this.config.outputDir}`)
  }

  async run(): Promise<void> {
    console.log('🧹 UlazAI Watermark Removal Tool')
    console.log('================================')

    if (!this.ensureFFmpegInstalled()) {
      return
    }

    this.ensureOutputDir()
    await this.processVideos()
  }
}

// Run the watermark remover
if (require.main === module) {
  const remover = new WatermarkRemover()
  remover.run().catch(console.error)
}

export default WatermarkRemover 