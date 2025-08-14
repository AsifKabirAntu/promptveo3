import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Video directories to check
const VIDEO_DIRECTORIES = [
  'data/ulazai-videos',
  'data/ulazai-videos-clean',
  'data/promptveo3-branded'
]

interface VideoInfo {
  filename: string
  width: number
  height: number
  aspectRatio: string
  isVertical: boolean
  path: string
  hasUlazaiWatermark: boolean
  hasPromptVeo3Watermark: boolean
}

async function getVideoInfo(videoPath: string): Promise<VideoInfo | null> {
  try {
    console.log(`🔍 Analyzing: ${path.basename(videoPath)}`)
    
    // Get video dimensions using ffprobe
    const probeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`
    const probeOutput = execSync(probeCommand, { encoding: 'utf8' })
    const probeData = JSON.parse(probeOutput)
    
    const videoStream = probeData.streams.find((stream: any) => stream.codec_type === 'video')
    if (!videoStream) {
      console.log(`⚠️  No video stream found in: ${path.basename(videoPath)}`)
      return null
    }

    const width = parseInt(videoStream.width)
    const height = parseInt(videoStream.height)
    const aspectRatio = (width / height).toFixed(2)
    const isVertical = height > width && Math.abs(height / width - 16/9) < 0.1 // 9:16 ratio check

    console.log(`📐 Dimensions: ${width}x${height} (${aspectRatio}) - ${isVertical ? 'VERTICAL 9:16' : 'HORIZONTAL'}`)

    // Extract a frame from the bottom-left corner to check for watermarks
    const tempFramePath = 'temp_watermark_check.png'
    const frameCommand = `ffmpeg -y -i "${videoPath}" -vf "crop=200:50:0:${height-50}" -frames:v 1 -q:v 2 "${tempFramePath}"`
    
    let hasUlazaiWatermark = false
    let hasPromptVeo3Watermark = false
    
    try {
      execSync(frameCommand, { stdio: 'pipe' })
      
      // Check if the video filename indicates it's already processed
      const filename = path.basename(videoPath).toLowerCase()
      hasPromptVeo3Watermark = filename.includes('promptveo3') || 
                               filename.includes('branded') || 
                               filename.includes('enhanced-ai') ||
                               filename.includes('watermark-removed')
      
      if (!hasPromptVeo3Watermark) {
        // Use file size and filename to detect potential UlazAI watermarks
        const stats = fs.statSync(tempFramePath)
        const hasContent = stats.size > 3000 // Lower threshold for text detection
        
        // Assume UlazAI watermark if it's a vertical video and hasn't been processed
        hasUlazaiWatermark = hasContent && !filename.includes('clean') && !filename.includes('no-watermark')
      }
      
      // Clean up temp file
      if (fs.existsSync(tempFramePath)) {
        fs.unlinkSync(tempFramePath)
      }
    } catch (frameError) {
      console.log(`⚠️  Could not extract frame for watermark detection`)
      // Fallback: check filename for processing indicators
      const filename = path.basename(videoPath).toLowerCase()
      hasPromptVeo3Watermark = filename.includes('promptveo3') || filename.includes('branded')
      hasUlazaiWatermark = !hasPromptVeo3Watermark && !filename.includes('clean')
    }

    return {
      filename: path.basename(videoPath),
      width,
      height,
      aspectRatio,
      isVertical,
      path: videoPath,
      hasUlazaiWatermark,
      hasPromptVeo3Watermark
    }
  } catch (error) {
    console.error(`❌ Error analyzing ${videoPath}:`, error)
    return null
  }
}

async function findVerticalVideos(): Promise<VideoInfo[]> {
  console.log('🔍 Scanning for vertical (9:16) videos with UlazAI watermarks...')
  
  const verticalVideos: VideoInfo[] = []
  
  for (const directory of VIDEO_DIRECTORIES) {
    const dirPath = path.resolve(directory)
    
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  Directory not found: ${dirPath}`)
      continue
    }

    console.log(`📁 Scanning: ${directory}`)
    const files = fs.readdirSync(dirPath)
    const videoFiles = files.filter(file => 
      file.match(/\.(mp4|mov|avi|mkv|webm)$/i)
    )

    console.log(`   Found ${videoFiles.length} video files`)

    for (const file of videoFiles) { // Process ALL files, not just first 10
      const videoPath = path.join(dirPath, file)
      const videoInfo = await getVideoInfo(videoPath)
      
      if (videoInfo?.isVertical && videoInfo.hasUlazaiWatermark && !videoInfo.hasPromptVeo3Watermark) {
        console.log(`✅ Found vertical video with UlazAI watermark: ${file}`)
        verticalVideos.push(videoInfo)
      } else if (videoInfo?.isVertical && videoInfo.hasPromptVeo3Watermark) {
        console.log(`⏭️  Skipping (already has PromptVeo3 branding): ${file}`)
      } else if (videoInfo?.isVertical) {
        console.log(`ℹ️  Vertical but no watermark detected: ${file}`)
      }
      
      // Add a small delay to prevent overwhelming the system
      if (videoFiles.indexOf(file) % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  return verticalVideos
}

async function removeUlazaiWatermark(videoInfo: VideoInfo): Promise<string | null> {
  try {
    const outputDir = 'data/ulazai-watermarks-removed'
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputFilename = `${path.parse(videoInfo.filename).name}-watermark-removed.mp4`
    const outputPath = path.join(outputDir, outputFilename)

    console.log(`🎬 Removing UlazAI watermark from: ${videoInfo.filename}`)
    
    // Remove watermark from bottom-left corner for vertical 9:16 videos
    // UlazAI watermark is typically small text in the bottom-left
    const delogoFilter = `delogo=x=10:y=${videoInfo.height - 60}:w=120:h=40`
    
    const command = `ffmpeg -y -i "${videoInfo.path}" -vf "${delogoFilter}" -c:a copy "${outputPath}"`
    
    console.log(`⚙️  Command: ${command}`)
    execSync(command, { stdio: 'pipe' })
    
    const stats = fs.statSync(outputPath)
    console.log(`✅ Watermark removed: ${outputFilename} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`)
    
    return outputPath
  } catch (error) {
    console.error(`❌ Error removing watermark from ${videoInfo.filename}:`, error)
    return null
  }
}

async function addPromptVeo3Branding(inputPath: string, originalVideoInfo: VideoInfo): Promise<string | null> {
  try {
    const outputDir = 'data/promptveo3-vertical-branded'
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputFilename = `${path.parse(originalVideoInfo.filename).name}-promptveo3-branded.mp4`
    const outputPath = path.join(outputDir, outputFilename)

    console.log(`🎨 Adding PromptVeo3 branding to: ${path.basename(inputPath)}`)
    
    // Add PromptVeo3 branding to bottom-left corner for vertical videos
    const textFilter = `drawtext=text='promptveo3.com':fontsize=24:fontcolor=white:x=20:y=${originalVideoInfo.height - 50}:background=0x4F46E5@0.8:padding=8`
    
    const command = `ffmpeg -y -i "${inputPath}" -vf "${textFilter}" -c:a copy "${outputPath}"`
    
    console.log(`⚙️  Command: ${command}`)
    execSync(command, { stdio: 'pipe' })
    
    const stats = fs.statSync(outputPath)
    console.log(`✅ PromptVeo3 branding added: ${outputFilename} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`)
    
    return outputPath
  } catch (error) {
    console.error(`❌ Error adding branding to ${inputPath}:`, error)
    return null
  }
}

async function main() {
  console.log('🎯 Starting vertical video watermark removal and rebranding...')
  console.log('🔍 Target: 9:16 videos with "ulazai.com" watermarks in bottom-left corner')
  console.log('⏭️  Skip: Videos already branded with "promptveo3.com"')
  console.log('')

  try {
    // Find all vertical videos with UlazAI watermarks
    const verticalVideos = await findVerticalVideos()
    
    if (verticalVideos.length === 0) {
      console.log('ℹ️  No vertical videos with UlazAI watermarks found')
      return
    }

    console.log(`\n📊 Found ${verticalVideos.length} vertical videos to process`)
    console.log('')

    let processed = 0
    let successful = 0
    let errors = 0

    for (const videoInfo of verticalVideos) {
      processed++
      console.log(`\n🎬 Processing ${processed}/${verticalVideos.length}: ${videoInfo.filename}`)
      
      // Step 1: Remove UlazAI watermark
      const cleanedPath = await removeUlazaiWatermark(videoInfo)
      
      if (cleanedPath) {
        // Step 2: Add PromptVeo3 branding
        const brandedPath = await addPromptVeo3Branding(cleanedPath, videoInfo)
        
        if (brandedPath) {
          successful++
          console.log(`✅ Successfully processed: ${videoInfo.filename}`)
        } else {
          errors++
        }
      } else {
        errors++
      }
    }

    console.log('\n🎉 Vertical video processing completed!')
    console.log('================================')
    console.log(`📊 Total processed: ${processed}`)
    console.log(`✅ Successful: ${successful}`)
    console.log(`❌ Failed: ${errors}`)
    console.log(`📁 Clean videos saved to: data/ulazai-watermarks-removed/`)
    console.log(`📁 Branded videos saved to: data/promptveo3-vertical-branded/`)

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
} 