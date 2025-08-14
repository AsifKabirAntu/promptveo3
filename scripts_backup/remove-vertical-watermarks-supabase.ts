import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import axios from 'axios'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface VideoInfo {
  id: string
  title: string
  video_url: string
  width: number
  height: number
  aspectRatio: string
  isVertical: boolean
  hasUlazaiWatermark: boolean
  localVideoPath?: string
}

async function getVideoInfo(videoPath: string): Promise<{ width: number; height: number; isVertical: boolean } | null> {
  try {
    // Get video dimensions using ffprobe
    const probeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`
    const probeOutput = execSync(probeCommand, { encoding: 'utf8' })
    const probeData = JSON.parse(probeOutput)
    
    const videoStream = probeData.streams.find((stream: any) => stream.codec_type === 'video')
    if (!videoStream) {
      return null
    }

    const width = parseInt(videoStream.width)
    const height = parseInt(videoStream.height)
    const isVertical = height > width && Math.abs(height / width - 16/9) < 0.1 // 9:16 ratio check

    return { width, height, isVertical }
  } catch (error) {
    console.error(`❌ Error analyzing ${videoPath}:`, error)
    return null
  }
}

async function downloadVideo(url: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`📥 Downloading: ${path.basename(outputPath)}`)
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    })

    const writer = fs.createWriteStream(outputPath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        const stats = fs.statSync(outputPath)
        console.log(`✅ Downloaded: ${path.basename(outputPath)} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`)
        resolve(true)
      })
      writer.on('error', reject)
    })
  } catch (error) {
    console.error(`❌ Error downloading ${url}:`, error)
    return false
  }
}

async function findVerticalVideosInSupabase(): Promise<VideoInfo[]> {
  console.log('🔍 Finding 9:16 videos with UlazAI watermarks in Supabase...')
  
  try {
    // Get all videos from the database
    const { data: prompts, error } = await supabase
      .from('community_prompts')
      .select('id, title, video_url')
      .not('video_url', 'is', null)
      .limit(50) // Start with 50 videos for testing

    if (error) {
      throw error
    }

    console.log(`📊 Found ${prompts?.length || 0} videos in database`)
    
    const verticalVideos: VideoInfo[] = []
    const tempDir = 'temp-video-analysis'
    
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    for (const prompt of prompts || []) {
      if (!prompt.video_url) continue

      // Skip if already processed
      if (prompt.video_url.includes('promptveo3-vertical-branded') || 
          prompt.video_url.includes('watermark-removed')) {
        console.log(`⏭️  Skipping (already processed): ${prompt.title}`)
        continue
      }

      console.log(`🔍 Analyzing: ${prompt.title}`)
      
      // Download video temporarily for analysis
      const tempVideoPath = path.join(tempDir, `${prompt.id}-temp.mp4`)
      const downloaded = await downloadVideo(prompt.video_url, tempVideoPath)
      
      if (!downloaded) continue

      // Analyze video dimensions
      const videoInfo = await getVideoInfo(tempVideoPath)
      
      if (videoInfo?.isVertical) {
        console.log(`📱 Found vertical video: ${prompt.title} (${videoInfo.width}x${videoInfo.height})`)
        
        verticalVideos.push({
          id: prompt.id,
          title: prompt.title,
          video_url: prompt.video_url,
          width: videoInfo.width,
          height: videoInfo.height,
          aspectRatio: (videoInfo.width / videoInfo.height).toFixed(2),
          isVertical: true,
          hasUlazaiWatermark: true, // Assume all have UlazAI watermarks
          localVideoPath: tempVideoPath
        })
      } else {
        // Remove temp file if not vertical
        fs.unlinkSync(tempVideoPath)
      }
    }

    console.log(`\n📊 Found ${verticalVideos.length} vertical (9:16) videos to process`)
    return verticalVideos

  } catch (error) {
    console.error('❌ Error finding vertical videos:', error)
    return []
  }
}

async function removeUlazaiWatermark(videoInfo: VideoInfo): Promise<string | null> {
  try {
    if (!videoInfo.localVideoPath) return null

    const outputDir = 'temp-processed'
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputFilename = `${videoInfo.id}-watermark-removed.mp4`
    const outputPath = path.join(outputDir, outputFilename)

    console.log(`🎬 Removing UlazAI watermark from: ${videoInfo.title}`)
    
    // Remove watermark from bottom-left corner for vertical 9:16 videos
    const delogoFilter = `delogo=x=10:y=${videoInfo.height - 60}:w=120:h=40`
    
    const command = `ffmpeg -y -i "${videoInfo.localVideoPath}" -vf "${delogoFilter}" -c:a copy "${outputPath}"`
    
    console.log(`⚙️  Removing watermark...`)
    execSync(command, { stdio: 'pipe' })
    
    const stats = fs.statSync(outputPath)
    console.log(`✅ Watermark removed: ${outputFilename} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`)
    
    return outputPath
  } catch (error) {
    console.error(`❌ Error removing watermark from ${videoInfo.title}:`, error)
    return null
  }
}

async function addPromptVeo3Branding(inputPath: string, videoInfo: VideoInfo): Promise<string | null> {
  try {
    const outputDir = 'temp-processed'
    const outputFilename = `${videoInfo.id}-promptveo3-branded.mp4`
    const outputPath = path.join(outputDir, outputFilename)

    console.log(`🎨 Adding PromptVeo3 branding...`)
    
    // Add PromptVeo3 branding to bottom-left corner for vertical videos
    // Fixed: Use 'box' instead of 'background' and 'boxcolor' instead of 'background'
    const textFilter = `drawtext=text='promptveo3.com':fontsize=24:fontcolor=white:x=20:y=${videoInfo.height - 50}:box=1:boxcolor=0x4F46E5@0.8:boxborderw=8`
    
    const command = `ffmpeg -y -i "${inputPath}" -vf "${textFilter}" -c:a copy "${outputPath}"`
    
    execSync(command, { stdio: 'pipe' })
    
    const stats = fs.statSync(outputPath)
    console.log(`✅ PromptVeo3 branding added: ${outputFilename} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`)
    
    return outputPath
  } catch (error) {
    console.error(`❌ Error adding branding:`, error)
    return null
  }
}

async function uploadToSupabase(filePath: string, videoInfo: VideoInfo): Promise<string | null> {
  try {
    const filename = `${videoInfo.id}-promptveo3-vertical-branded.mp4`
    const bucketName = 'community-videos' // Changed from 'videos' to 'community-videos'
    
    console.log(`☁️  Uploading to Supabase: ${filename}`)
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`promptveo3-vertical-branded/${filename}`, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`promptveo3-vertical-branded/${filename}`)

    console.log(`✅ Uploaded to Supabase: ${filename}`)
    return publicData.publicUrl

  } catch (error) {
    console.error(`❌ Error uploading to Supabase:`, error)
    return null
  }
}

async function updateDatabaseWithNewVideo(videoInfo: VideoInfo, newVideoUrl: string): Promise<boolean> {
  try {
    console.log(`💾 Updating database for: ${videoInfo.title}`)
    
    const { error } = await supabase
      .from('community_prompts')
      .update({ 
        video_url: newVideoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoInfo.id)

    if (error) {
      throw error
    }

    console.log(`✅ Database updated for: ${videoInfo.title}`)
    return true

  } catch (error) {
    console.error(`❌ Error updating database:`, error)
    return false
  }
}

async function cleanupTempFiles(videoInfo: VideoInfo, processedPaths: string[]) {
  // Clean up temp files
  if (videoInfo.localVideoPath && fs.existsSync(videoInfo.localVideoPath)) {
    fs.unlinkSync(videoInfo.localVideoPath)
  }
  
  for (const path of processedPaths) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path)
    }
  }
}

async function main() {
  console.log('🎯 Starting Supabase vertical video watermark removal and rebranding...')
  console.log('🔍 Target: 9:16 videos with "ulazai.com" watermarks in bottom-left corner')
  console.log('☁️  Source: Supabase Storage')
  console.log('')

  try {
    // Find all vertical videos with UlazAI watermarks
    const verticalVideos = await findVerticalVideosInSupabase()
    
    if (verticalVideos.length === 0) {
      console.log('ℹ️  No vertical videos with Ulazai watermarks found')
      return
    }

    console.log(`\n🎬 Processing ${verticalVideos.length} vertical videos...`)
    console.log('')

    let processed = 0
    let successful = 0
    let errors = 0

    for (const videoInfo of verticalVideos) {
      processed++
      console.log(`\n🎬 Processing ${processed}/${verticalVideos.length}: ${videoInfo.title}`)
      
      const processedPaths: string[] = []
      
      try {
        // Step 1: Remove UlazAI watermark
        const cleanedPath = await removeUlazaiWatermark(videoInfo)
        if (cleanedPath) processedPaths.push(cleanedPath)
        
        if (cleanedPath) {
          // Step 2: Add PromptVeo3 branding
          const brandedPath = await addPromptVeo3Branding(cleanedPath, videoInfo)
          if (brandedPath) processedPaths.push(brandedPath)
          
          if (brandedPath) {
            // Step 3: Upload to Supabase
            const newVideoUrl = await uploadToSupabase(brandedPath, videoInfo)
            
            if (newVideoUrl) {
              // Step 4: Update database
              const dbUpdated = await updateDatabaseWithNewVideo(videoInfo, newVideoUrl)
              
              if (dbUpdated) {
                successful++
                console.log(`✅ Successfully processed: ${videoInfo.title}`)
              } else {
                errors++
              }
            } else {
              errors++
            }
          } else {
            errors++
          }
        } else {
          errors++
        }

      } catch (error) {
        console.error(`❌ Error processing ${videoInfo.title}:`, error)
        errors++
      } finally {
        // Clean up temp files
        await cleanupTempFiles(videoInfo, processedPaths)
      }
    }

    console.log('\n🎉 Supabase vertical video processing completed!')
    console.log('================================')
    console.log(`📊 Total processed: ${processed}`)
    console.log(`✅ Successful: ${successful}`)
    console.log(`❌ Failed: ${errors}`)
    console.log(`☁️  Processed videos uploaded to: promptveo3-vertical-branded/ bucket`)

    // Clean up temp directories
    const tempDirs = ['temp-video-analysis', 'temp-processed']
    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
} 