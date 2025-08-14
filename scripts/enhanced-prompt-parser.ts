import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as cheerio from 'cheerio'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

class EnhancedPromptParser {
  
  cleanHTMLContent(htmlContent: string): string | null {
    try {
      const $ = cheerio.load(htmlContent)
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, .menu, .navigation, .sidebar').remove()
      $('[class*="navigation"], [class*="header"], [class*="footer"]').remove()
      
      // Look for prompt content in common containers
      const promptSelectors = [
        'pre',
        'code',
        '.prompt',
        '.content',
        'main',
        '[data-prompt]',
        '.description'
      ]
      
      for (const selector of promptSelectors) {
        const element = $(selector)
        if (element.length > 0) {
          const text = element.text().trim()
          if (text.length > 50 && this.isPromptLike(text)) {
            return this.cleanText(text)
          }
        }
      }
      
             // Fallback: extract all text and clean it
       const allText = $.root().text()
       return this.extractPromptFromText(allText)
      
    } catch (error) {
      console.error('Error parsing HTML:', error)
      return null
    }
  }
  
  extractPromptFromText(text: string): string | null {
    // Clean up the text
    let cleaned = text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/Directory.*?Prompt/gi, '')
      .replace(/🧙.*?UlazAI/gi, '')
      .replace(/Login.*?Sign up/gi, '')
      .replace(/Subscribe.*?Newsletter/gi, '')
      .replace(/Home.*?Directory/gi, '')
      .replace(/Back to Directory/gi, '')
      .replace(/View Profile/gi, '')
      .replace(/Copy Link/gi, '')
      .replace(/Share/gi, '')
      .trim()
    
    // Look for JSON structure first
    const jsonMatch = cleaned.match(/\{[\s\S]*?"video"[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed && typeof parsed === 'object') {
          return JSON.stringify(parsed, null, 2)
        }
      } catch (e) {
        // Continue with text processing
      }
    }
    
    // Look for structured prompt sections
    const sections = [
      'Veo 3 Prompt:',
      'Prompt:',
      'Description:',
      'Video:',
      'Scene:'
    ]
    
    for (const section of sections) {
      const sectionIndex = cleaned.toLowerCase().indexOf(section.toLowerCase())
      if (sectionIndex !== -1) {
        // Extract content after the section header
        let content = cleaned.substring(sectionIndex + section.length).trim()
        
        // Stop at next section or end
        const nextSectionIndex = this.findNextSection(content, sections)
        if (nextSectionIndex !== -1) {
          content = content.substring(0, nextSectionIndex).trim()
        }
        
        if (content.length > 50 && this.isPromptLike(content)) {
          return this.cleanText(content)
        }
      }
    }
    
    // Look for video-related content
    const videoKeywords = ['video', 'scene', 'camera', 'shot', 'cinematic', 'footage']
    const lines = cleaned.split('\n').filter(line => line.trim().length > 20)
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      const keywordCount = videoKeywords.filter(keyword => lowerLine.includes(keyword)).length
      
      if (keywordCount >= 2 && line.length > 100) {
        return this.cleanText(line)
      }
    }
    
    // Fallback: return the longest meaningful sentence
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 50)
    if (sentences.length > 0) {
      const longest = sentences.reduce((a, b) => a.length > b.length ? a : b)
      if (this.isPromptLike(longest)) {
        return this.cleanText(longest)
      }
    }
    
    return null
  }
  
  findNextSection(text: string, sections: string[]): number {
    let earliestIndex = -1
    
    for (const section of sections) {
      const index = text.toLowerCase().indexOf(section.toLowerCase())
      if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
        earliestIndex = index
      }
    }
    
    return earliestIndex
  }
  
  isPromptLike(text: string): boolean {
    const lowerText = text.toLowerCase()
    const promptKeywords = [
      'video', 'scene', 'camera', 'shot', 'cinematic', 'footage',
      'close-up', 'wide shot', 'medium shot', 'pan', 'zoom',
      'lighting', 'dramatic', 'focus', 'frame', 'motion'
    ]
    
    const keywordCount = promptKeywords.filter(keyword => lowerText.includes(keyword)).length
    return keywordCount >= 2 && text.length > 50
  }
  
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-"']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  async processAllPrompts(limit: number = 500): Promise<void> {
    try {
      console.log('🔍 Fetching prompts to reparse...')
      
      const { data: prompts, error } = await supabase
        .from('community_prompts')
        .select('id, title, full_prompt_text, veo3_prompt')
        .or('veo3_prompt.is.null,veo3_prompt.eq.')
        .limit(limit)
      
      if (error) {
        console.error('❌ Error fetching prompts:', error)
        return
      }
      
      console.log(`📋 Found ${prompts.length} prompts to reparse`)
      
      let successCount = 0
      let failCount = 0
      
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i]
        console.log(`\n📄 Processing ${i + 1}/${prompts.length}: ${prompt.title}`)
        
        const cleanPrompt = this.cleanHTMLContent(prompt.full_prompt_text)
        
        if (cleanPrompt) {
          const { error: updateError } = await supabase
            .from('community_prompts')
            .update({
              veo3_prompt: cleanPrompt,
              updated_at: new Date().toISOString()
            })
            .eq('id', prompt.id)
          
          if (updateError) {
            console.error(`❌ Update error for ${prompt.id}:`, updateError)
            failCount++
          } else {
            console.log(`✅ Successfully parsed: ${prompt.title}`)
            successCount++
          }
        } else {
          console.log(`⚠️  Could not extract clean prompt from: ${prompt.title}`)
          failCount++
        }
      }
      
      console.log(`\n📊 Enhanced Parsing Complete!`)
      console.log(`✅ Successfully parsed: ${successCount}`)
      console.log(`❌ Failed: ${failCount}`)
      
    } catch (error) {
      console.error('❌ Error in processAllPrompts:', error)
    }
  }
}

async function main() {
  const parser = new EnhancedPromptParser()
  
  try {
    await parser.processAllPrompts()
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export default EnhancedPromptParser 