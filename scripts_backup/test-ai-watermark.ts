import AIWatermarkDetector from './ai-watermark-detection'
import path from 'path'

async function testSpecificVideo() {
  const detector = new (AIWatermarkDetector as any)()
  
  const inputVideo = 'data/ulazai-videos/ae72311a-56d9-4489-ac42-be852886a021-Handheld-home-video-on-a-small-lakeside-dock-at-go.mp4'
  const outputVideo = 'data/promptveo3-ai-branded/lakeside-test-ai-branded.mp4'
  
  console.log('🧪 Testing AI Watermark Detection on Lakeside Video')
  console.log(`📹 Input: ${inputVideo}`)
  console.log(`📤 Output: ${outputVideo}`)
  console.log('')
  
  const success = await detector.processVideo(inputVideo, outputVideo)
  
  if (success) {
    console.log('✅ Test completed successfully!')
    console.log('🎬 Check the output video to see AI-detected watermark replacement')
  } else {
    console.log('❌ Test failed')
  }
}

testSpecificVideo().catch(console.error) 