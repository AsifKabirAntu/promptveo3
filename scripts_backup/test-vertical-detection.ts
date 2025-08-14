import EnhancedAIDetector from './enhanced-ai-detection'
import path from 'path'

async function testVerticalVideos() {
  const detector = new (EnhancedAIDetector as any)()
  
  // Test specific vertical videos
  const testVideos = [
    'ae72311a-56d9-4489-ac42-be852886a021-Handheld-home-video-on-a-small-lakeside-dock-at-go.mp4', // Your lakeside example
    '29c0a647-87ae-436c-ad3e-622629c10027-916-vertical-8s-ultra-realistic-cinematic-golde.mp4',
    '2c84c47a-8ed9-4395-b1d1-d9be645cc79c--prompt-Realistic-vertical-video-in-a-cozy-.mp4'
  ]
  
  console.log('🧪 Testing Enhanced AI Detection on Vertical Videos')
  console.log('==================================================')
  console.log('')
  
  for (let i = 0; i < testVideos.length; i++) {
    const videoFile = testVideos[i]
    const inputVideo = `data/ulazai-videos/${videoFile}`
    const outputVideo = `data/promptveo3-enhanced-ai/test-vertical-${i+1}-enhanced-ai.mp4`
    
    console.log(`🎬 Test ${i+1}/3: ${videoFile.substring(0, 60)}...`)
    console.log('')
    
    const success = await detector.processVideo(inputVideo, outputVideo)
    
    if (success) {
      console.log(`✅ Test ${i+1} completed successfully!`)
    } else {
      console.log(`❌ Test ${i+1} failed`)
    }
    console.log('')
    console.log('─'.repeat(60))
    console.log('')
  }
  
  console.log('🎯 Vertical Video Testing Complete!')
  console.log('Check the enhanced AI outputs to see watermark detection results')
}

testVerticalVideos().catch(console.error) 