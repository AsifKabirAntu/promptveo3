import { createClient } from '@supabase/supabase-js'
import puppeteer, { Browser, Page } from 'puppeteer'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testScraping() {
  let browser: Browser | null = null
  
  try {
    console.log('🚀 Starting test scraping...')
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    const testUrl = 'https://ulazai.com/directory/prompt/20f28c28-2b66-4ae1-9456-ef66d5a501ce/'
    console.log(`🔍 Testing: ${testUrl}`)
    
    await page.goto(testUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    })
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simple extraction test
    const result = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim() || 'No title found'
      const description = document.querySelector('p')?.textContent?.trim() || 'No description found'
      
      return {
        title,
        description,
        url: window.location.href
      }
    })
    
    console.log('✅ Test result:', result)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

testScraping().catch(console.error) 