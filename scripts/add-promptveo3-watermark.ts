import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

interface BrandingConfig {
  inputDir: string
  outputDir: string
  watermarkText: string
  textStyle: {
    fontsize: number
    fontcolor: string
    background: string
    padding: number
    borderwidth: number
    bordercolor: string
  }
  position: {
    x: number
    y: number
  }
}

class PromptVeo3Branding {
  private config: BrandingConfig

  constructor() {
    this.config = {
      inputDir: path.join(process.cwd(), 'data', 'ulazai-videos'),
      outputDir: path.join(process.cwd(), 'data', 'promptveo3-branded'),
      watermarkText: 'promptveo3.com',
      textStyle: {
        fontsize: 20, // Increased from 16 to 20
        fontcolor: 'white',
        background: '#2563eb@0.95', // Stronger blue with more opacity
        padding: 12, // Increased padding for bigger appearance
        borderwidth: 0,
        bordercolor: '#1d4ed8'
      },
      position: {
        x: 10, // 10px from left
        y: -45 // 45px from bottom (adjusted for bigger size)
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

  private generateTextFilter(): string {
    const { watermarkText, textStyle, position } = this.config
    
    // Create a sophisticated text overlay with blue background
    return `drawtext=text='${watermarkText}':` +
           `fontsize=${textStyle.fontsize}:` +
           `fontcolor=${textStyle.fontcolor}:` +
           `x=${position.x}:` +
           `y=h${position.y}:` + // h-35 means 35px from bottom
           `box=1:` +
           `boxcolor=${textStyle.background}:` +
           `boxborderw=${textStyle.padding}:` +
           `fontfile=/System/Library/Fonts/Helvetica.ttc` // Clean, professional font
  }

  private addBrandingToVideo(inputPath: string, outputPath: string): boolean {
    try {
      const textFilter = this.generateTextFilter()
      
      // FFmpeg command to replace watermark area and add new branding
      const command = [
        'ffmpeg',
        '-i', `"${inputPath}"`,
        '-vf', `"${textFilter}"`,
        '-c:a', 'copy', // Keep audio unchanged
        '-c:v', 'libx264', // Re-encode video with new overlay
        '-preset', 'fast', // Balance quality vs speed
        '-crf', '18', // High quality
        '-y', // Overwrite output file
        `"${outputPath}"`
      ].join(' ')

      console.log(`🎨 Adding promptveo3.com branding: ${path.basename(inputPath)}`)
      execSync(command, { stdio: 'pipe' })
      
      // Verify output file was created and has reasonable size
      if (fs.existsSync(outputPath)) {
        const inputSize = fs.statSync(inputPath).size
        const outputSize = fs.statSync(outputPath).size
        const sizeMB = (outputSize / (1024 * 1024)).toFixed(1)
        
        // Check if output is reasonable (not too small, indicating failure)
        if (outputSize > inputSize * 0.5) {
          console.log(`✅ Branded video created: ${path.basename(outputPath)} (${sizeMB}MB)`)
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

    console.log('🎨 PromptVeo3 Video Branding Tool')
    console.log('===============================')
    console.log(`📂 Input: ${this.config.inputDir}`)
    console.log(`📂 Output: ${this.config.outputDir}`)
    console.log(`🏷️  Brand: ${this.config.watermarkText}`)
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
      const outputFileName = videoFile.replace('.mp4', '-branded.mp4')
      const outputPath = path.join(this.config.outputDir, outputFileName)

      // Skip if already processed
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  Skipping ${videoFile} (already branded)`)
        skipped++
        continue
      }

      console.log(`\n🎬 Processing ${processed}/${videoFiles.length}: ${videoFile}`)
      
      const success = this.addBrandingToVideo(inputPath, outputPath)
      
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

    console.log('\n🎨 Branding Complete!')
    console.log('===================')
    console.log(`📊 Total processed: ${processed}`)
    console.log(`✅ Successful: ${successful}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`📁 Branded videos saved to: ${this.config.outputDir}`)
  }
}

// Main execution
async function main() {
  const branding = new PromptVeo3Branding()
  
  // Get limit from command line args (default to 10 for testing)
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 10
  
  await branding.processVideos(limit)
}

// Export for use in other scripts
export default PromptVeo3Branding

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
} 