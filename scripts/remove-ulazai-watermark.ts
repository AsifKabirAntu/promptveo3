import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

interface UlazaiConfig {
  inputDir: string
  outputDir: string
}

class UlazaiWatermarkRemover {
  private config: UlazaiConfig

  constructor() {
    this.config = {
      inputDir: path.join(process.cwd(), 'data', 'ulazai-videos'),
      outputDir: path.join(process.cwd(), 'data', 'ulazai-videos-clean')
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
    }
  }

  private removeUlazaiWatermark(inputPath: string, outputPath: string): boolean {
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

      // Create a more sophisticated filter for "ulazai.com" watermark removal
      const filters: string[] = []
      
      // 1. Target the specific bottom-left area where "ulazai.com" appears
      // For 1280x720, the watermark is typically around x=10-15, y=680-700
      const watermarkX = 10
      const watermarkY = height - 40  // 40 pixels from bottom
      const watermarkWidth = 120      // Width of "ulazai.com" text
      const watermarkHeight = 30      // Height of text area
      
      // Use delogo filter to remove the watermark
      filters.push(`delogo=x=${watermarkX}:y=${watermarkY}:w=${watermarkWidth}:h=${watermarkHeight}:show=0`)
      
      // 2. Add a slightly blurred area to blend better
      const blurX = watermarkX - 5
      const blurY = watermarkY - 5
      const blurWidth = watermarkWidth + 10
      const blurHeight = watermarkHeight + 10
      
      // Create a mask for the watermark area and apply slight blur
      filters.push(`boxblur=2:1:cr=0:ar=0`)
      
      // 3. Apply noise reduction to clean up artifacts
      filters.push('hqdn3d=2:1:2:1')
      
      // 4. Slight sharpening to restore detail
      filters.push('unsharp=5:5:0.3:3:3:0.2')

      const filterComplex = filters.join(',')
      
      // FFmpeg command with specific watermark removal
      const ffmpegCmd = [
        'ffmpeg',
        '-i', `"${inputPath}"`,
        '-vf', `"${filterComplex}"`,
        '-c:v', 'libx264',
        '-crf', '20',  // Higher quality
        '-preset', 'slow',  // Better compression
        '-c:a', 'copy',  // Copy audio without re-encoding
        '-y', // Overwrite output
        `"${outputPath}"`
      ].join(' ')

      console.log(`   🔧 Removing ulazai.com watermark...`)
      
      execSync(ffmpegCmd, { stdio: 'pipe' })
      
      // Check if output file was created and has reasonable size
      if (fs.existsSync(outputPath)) {
        const inputSize = fs.statSync(inputPath).size
        const outputSize = fs.statSync(outputPath).size
        
        if (outputSize > inputSize * 0.3) { // At least 30% of original size
          console.log(`   ✅ Success: ${(outputSize / 1024 / 1024).toFixed(1)}MB (${Math.round(outputSize / inputSize * 100)}% of original)`)
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

  private async processVideos(count: number = 10): Promise<void> {
    const videoFiles = fs.readdirSync(this.config.inputDir)
      .filter(file => file.endsWith('.mp4'))
      .slice(0, count)

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

      if (this.removeUlazaiWatermark(inputPath, outputPath)) {
        successful++
      } else {
        failed++
        // Copy original if watermark removal failed
        console.log(`   📋 Copying original as fallback...`)
        fs.copyFileSync(inputPath, outputPath.replace('-clean.mp4', '-original.mp4'))
      }

      // Small delay to prevent system overload
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`\n📊 Ulazai Watermark Removal Results:`)
    console.log(`   ✅ Successful: ${successful}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📁 Clean videos saved to: ${this.config.outputDir}`)
    console.log(`   🎯 Success rate: ${Math.round(successful / videoFiles.length * 100)}%`)
  }

  async run(count: number = 10): Promise<void> {
    console.log('🧹 UlazAI "ulazai.com" Watermark Removal Tool')
    console.log('============================================')

    if (!this.ensureFFmpegInstalled()) {
      return
    }

    this.ensureOutputDir()
    await this.processVideos(count)
  }
}

// Run the watermark remover
if (require.main === module) {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 10
  const remover = new UlazaiWatermarkRemover()
  remover.run(count).catch(console.error)
}

export default UlazaiWatermarkRemover 