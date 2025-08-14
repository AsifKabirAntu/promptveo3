import WatermarkRemover from './remove-watermarks'
import fs from 'fs'
import path from 'path'

class BatchWatermarkRemover extends WatermarkRemover {
  async processAllVideos(): Promise<void> {
    const inputDir = path.join(process.cwd(), 'data', 'ulazai-videos')
    const outputDir = path.join(process.cwd(), 'data', 'ulazai-videos-clean')
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const allVideoFiles = fs.readdirSync(inputDir)
      .filter(file => file.endsWith('.mp4'))

    console.log(`🎬 Found ${allVideoFiles.length} total videos`)
    
    const batchSize = 50
    let totalProcessed = 0
    let totalSuccessful = 0
    let totalFailed = 0

    for (let i = 0; i < allVideoFiles.length; i += batchSize) {
      const batch = allVideoFiles.slice(i, i + batchSize)
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allVideoFiles.length / batchSize)}`)
      console.log(`   Videos ${i + 1}-${Math.min(i + batchSize, allVideoFiles.length)} of ${allVideoFiles.length}`)

      let batchSuccessful = 0
      let batchFailed = 0

      for (const file of batch) {
        const inputPath = path.join(inputDir, file)
        const outputPath = path.join(outputDir, file.replace('.mp4', '-clean.mp4'))

        if (fs.existsSync(outputPath)) {
          console.log(`⏭️  Skipping ${file} (already processed)`)
          batchSuccessful++
          continue
        }

        try {
          if ((this as any).removeWatermark(inputPath, outputPath)) {
            batchSuccessful++
          } else {
            batchFailed++
            // Copy original if watermark removal failed
            fs.copyFileSync(inputPath, outputPath.replace('-clean.mp4', '-original.mp4'))
          }
        } catch (error) {
          console.error(`❌ Error processing ${file}:`, error)
          batchFailed++
        }

        // Small delay to prevent system overload
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      totalProcessed += batch.length
      totalSuccessful += batchSuccessful
      totalFailed += batchFailed

      console.log(`📊 Batch Results: ✅ ${batchSuccessful} successful, ❌ ${batchFailed} failed`)
      console.log(`📈 Total Progress: ${totalProcessed}/${allVideoFiles.length} (${Math.round(totalProcessed / allVideoFiles.length * 100)}%)`)

      // Longer pause between batches
      if (i + batchSize < allVideoFiles.length) {
        console.log('⏳ Pausing 10 seconds between batches...')
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
    }

    console.log(`\n🎉 All videos processed!`)
    console.log(`📊 Final Results:`)
    console.log(`   ✅ Successful: ${totalSuccessful}`)
    console.log(`   ❌ Failed: ${totalFailed}`)
    console.log(`   📁 Clean videos saved to: ${outputDir}`)
    console.log(`   🎯 Success rate: ${Math.round(totalSuccessful / allVideoFiles.length * 100)}%`)
  }

  async run(): Promise<void> {
    console.log('🧹 UlazAI Batch Watermark Removal Tool')
    console.log('====================================')

    if (!(this as any).ensureFFmpegInstalled()) {
      return
    }

    await this.processAllVideos()
  }
}

// Run the batch watermark remover
if (require.main === module) {
  const remover = new BatchWatermarkRemover()
  remover.run().catch(console.error)
}

export default BatchWatermarkRemover 