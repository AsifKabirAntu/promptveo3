import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'
config({ path: '.env.local' })

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface UploadConfig {
  videoInputDir: string
  thumbnailInputDir: string
  videoBucket: string
  thumbnailBucket: string
}

class SupabaseUploader {
  private config: UploadConfig

  constructor() {
    this.config = {
      videoInputDir: path.join(process.cwd(), 'data', 'promptveo3-enhanced-ai'),
      thumbnailInputDir: path.join(process.cwd(), 'data', 'ulazai-thumbnails'),
      videoBucket: 'community-videos',
      thumbnailBucket: 'community-thumbnails'
    }
  }

  private async createBucketIfNotExists(bucketName: string): Promise<void> {
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      console.log(`📁 Creating bucket: ${bucketName}`)
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: bucketName.includes('video') 
          ? ['video/mp4', 'video/mov', 'video/webm']
          : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        // Remove fileSizeLimit to use Supabase defaults
      })
      
      if (error) {
        console.error(`❌ Error creating bucket ${bucketName}:`, error)
        throw error
      }
      
      console.log(`✅ Created bucket: ${bucketName}`)
    } else {
      console.log(`✅ Bucket already exists: ${bucketName}`)
    }
  }

  private async uploadFile(filePath: string, bucketName: string, fileName: string): Promise<string | null> {
    try {
      // Read file as buffer
      const fileBuffer = fs.readFileSync(filePath)
      const stats = fs.statSync(filePath)
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(1)
      
      console.log(`📤 Uploading ${fileName} (${sizeMB}MB)`)
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          upsert: true,
          contentType: bucketName.includes('video') 
            ? 'video/mp4' 
            : 'image/jpeg'
        })

      if (error) {
        console.error(`❌ Error uploading ${fileName}:`, error)
        return null
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      console.log(`✅ Uploaded: ${fileName}`)
      return publicUrl
      
    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error)
      return null
    }
  }

  async uploadVideos(limit: number = 10): Promise<{ success: number, failed: number, urls: Record<string, string> }> {
    console.log('🎬 Uploading Videos to Supabase Storage')
    console.log('=====================================')
    
    await this.createBucketIfNotExists(this.config.videoBucket)
    
    const videoFiles = fs.readdirSync(this.config.videoInputDir)
      .filter(file => file.endsWith('.mp4') || file.endsWith('.mov'))
      .slice(0, limit)
    
    console.log(`📊 Found ${videoFiles.length} videos to upload`)
    
    let success = 0
    let failed = 0
    const urls: Record<string, string> = {}
    
    for (const videoFile of videoFiles) {
      const videoPath = path.join(this.config.videoInputDir, videoFile)
      
      // Generate clean filename for storage
      const cleanFileName = videoFile.replace('-enhanced-ai', '').replace('.mov', '.mp4')
      
      const publicUrl = await this.uploadFile(videoPath, this.config.videoBucket, cleanFileName)
      
      if (publicUrl) {
        success++
        urls[videoFile] = publicUrl
      } else {
        failed++
      }
    }
    
    console.log(`\n📊 Video Upload Summary:`)
    console.log(`✅ Successful: ${success}`)
    console.log(`❌ Failed: ${failed}`)
    
    return { success, failed, urls }
  }

  async uploadThumbnails(limit: number = 10): Promise<{ success: number, failed: number, urls: Record<string, string> }> {
    console.log('\n🖼️ Uploading Thumbnails to Supabase Storage')
    console.log('===========================================')
    
    await this.createBucketIfNotExists(this.config.thumbnailBucket)
    
    const thumbnailFiles = fs.readdirSync(this.config.thumbnailInputDir)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'))
      .slice(0, limit)
    
    console.log(`📊 Found ${thumbnailFiles.length} thumbnails to upload`)
    
    let success = 0
    let failed = 0
    const urls: Record<string, string> = {}
    
    for (const thumbnailFile of thumbnailFiles) {
      const thumbnailPath = path.join(this.config.thumbnailInputDir, thumbnailFile)
      
      const publicUrl = await this.uploadFile(thumbnailPath, this.config.thumbnailBucket, thumbnailFile)
      
      if (publicUrl) {
        success++
        urls[thumbnailFile] = publicUrl
      } else {
        failed++
      }
    }
    
    console.log(`\n📊 Thumbnail Upload Summary:`)
    console.log(`✅ Successful: ${success}`)
    console.log(`❌ Failed: ${failed}`)
    
    return { success, failed, urls }
  }

  async updateDatabaseUrls(videoUrls: Record<string, string>, thumbnailUrls: Record<string, string>): Promise<void> {
    console.log('\n📊 Updating Database with Supabase URLs')
    console.log('======================================')
    
    // Get all community prompts
    const { data: prompts, error } = await supabase
      .from('community_prompts')
      .select('id, local_video_path, video_thumbnail_url')
    
    if (error) {
      console.error('❌ Error fetching prompts:', error)
      return
    }
    
    if (!prompts) {
      console.log('❌ No prompts found')
      return
    }
    
    console.log(`📊 Found ${prompts.length} prompts to update`)
    
    let updated = 0
    let skipped = 0
    
    for (const prompt of prompts) {
      let updateData: any = {}
      let hasUpdates = false
      
      // Update video URL if we have a matching uploaded video
      if (prompt.local_video_path) {
        const videoFileName = prompt.local_video_path
        
        // Try to find matching uploaded video
        const matchingVideoUrl = Object.entries(videoUrls).find(([uploadedFile, url]) => 
          videoFileName.includes(uploadedFile.replace('-enhanced-ai', '').split('.')[0])
        )?.[1]
        
        if (matchingVideoUrl) {
          updateData.video_url = matchingVideoUrl
          updateData.local_video_path = null // Clear local path
          hasUpdates = true
        }
      }
      
      // Update thumbnail URL if we have a matching uploaded thumbnail
      if (prompt.video_thumbnail_url) {
        const thumbnailFileName = prompt.video_thumbnail_url
        
        if (thumbnailUrls[thumbnailFileName]) {
          updateData.video_thumbnail_url = thumbnailUrls[thumbnailFileName]
          hasUpdates = true
        }
      }
      
      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update(updateData)
          .eq('id', prompt.id)
        
        if (updateError) {
          console.error(`❌ Error updating prompt ${prompt.id}:`, updateError)
        } else {
          updated++
        }
      } else {
        skipped++
      }
    }
    
    console.log(`\n📊 Database Update Summary:`)
    console.log(`✅ Updated: ${updated}`)
    console.log(`⏭️ Skipped: ${skipped}`)
  }
}

// CLI interface
async function main() {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 10
  const uploader = new SupabaseUploader()
  
  try {
    // Upload videos
    const videoResults = await uploader.uploadVideos(limit)
    
    // Upload thumbnails
    const thumbnailResults = await uploader.uploadThumbnails(limit)
    
    // Update database
    await uploader.updateDatabaseUrls(videoResults.urls, thumbnailResults.urls)
    
    console.log('\n🎉 Supabase Storage Migration Complete!')
    console.log('====================================')
    console.log(`🎬 Videos: ${videoResults.success} uploaded, ${videoResults.failed} failed`)
    console.log(`🖼️ Thumbnails: ${thumbnailResults.success} uploaded, ${thumbnailResults.failed} failed`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export default SupabaseUploader 