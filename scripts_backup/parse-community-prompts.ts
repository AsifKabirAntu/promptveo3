import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

config({ path: '.env.local' })

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ParsedPromptData {
  veo3_prompt: string | null
  clean_description: string | null
  extracted_tags: string[]
}

class CommunityPromptParser {
  
  private parseStructuredYAML(content: string): ParsedPromptData {
    console.log('🔧 Parsing structured YAML format...')
    
    const result: ParsedPromptData = {
      veo3_prompt: null,
      clean_description: null,
      extracted_tags: []
    }

    // Extract structured content (everything before any HTML-like tags)
    const lines = content.split('\n')
    const yamlContent: string[] = []
    
    for (const line of lines) {
      // Stop at HTML tags or obvious non-YAML content
      if (line.includes('<') || line.includes('Directory') || line.includes('Copy Prompt')) {
        break
      }
      yamlContent.push(line)
    }
    
    const yamlText = yamlContent.join('\n').trim()
    
    if (yamlText) {
      result.veo3_prompt = yamlText
      
      // Try to extract description from concept/event field
      const conceptMatch = yamlText.match(/concept:\s*\n\s*event:\s*([^\n]+)/i)
      if (conceptMatch) {
        result.clean_description = conceptMatch[1].trim()
      }
    }

    return result
  }

  private parseHTMLContent(content: string): ParsedPromptData {
    console.log('🔧 Parsing HTML scraped content...')
    
    const result: ParsedPromptData = {
      veo3_prompt: null,
      clean_description: null,
      extracted_tags: []
    }

    // Look for "Veo 3 Prompt" section
    const veoPromptMatch = content.match(/Veo 3 Prompt[\s\S]*?([\s\S]*?)(?=\s*Tags|\s*Creator|\s*$)/)
    if (veoPromptMatch) {
      let veoContent = veoPromptMatch[1].trim()
      
      // Clean up the content - remove HTML artifacts
      veoContent = veoContent
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/^\s*Main Prompt:\s*/i, '') // Remove "Main Prompt:" prefix
        .trim()
      
      if (veoContent && veoContent.length > 10) {
        result.veo3_prompt = veoContent
      }
    }

    // Look for Description section
    const descMatch = content.match(/Description[\s\S]*?([\s\S]*?)(?=\s*Veo 3 Prompt|\s*Tags|\s*Creator|\s*$)/)
    if (descMatch) {
      let desc = descMatch[1].trim()
      
      // Clean up description
      desc = desc
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/Created with.*?AI.*?\./gi, '') // Remove AI creation mentions
        .replace(/\*\*[^*]+\*\*/g, '') // Remove bold markdown
        .trim()
      
      if (desc && desc.length > 10) {
        result.clean_description = desc
      }
    }

    // Extract tags
    const tagMatches = content.match(/#(\w+)/g)
    if (tagMatches) {
      result.extracted_tags = tagMatches.map(tag => tag.replace('#', ''))
    }

    return result
  }

  private parseContent(content: string): ParsedPromptData {
    if (!content || content.trim().length === 0) {
      return {
        veo3_prompt: null,
        clean_description: null,
        extracted_tags: []
      }
    }

    // Determine content type and parse accordingly
    if (content.includes('name:') && content.includes('duration:')) {
      // Structured YAML-like content
      return this.parseStructuredYAML(content)
    } else if (content.includes('Veo 3 Prompt') || content.includes('Description')) {
      // HTML scraped content with sections
      return this.parseHTMLContent(content)
    } else {
      // Fallback - treat as plain prompt
      console.log('🔧 Using fallback parsing...')
      const cleaned = content
        .replace(/<[^>]*>/g, '') // Remove HTML
        .replace(/Directory\s+/g, '') // Remove directory artifacts
        .replace(/Copy Prompt\s+/g, '') // Remove UI artifacts
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
      
      return {
        veo3_prompt: cleaned.length > 10 ? cleaned : null,
        clean_description: null,
        extracted_tags: []
      }
    }
  }

  async parseAllPrompts(limit: number = 10): Promise<void> {
    console.log('🚀 Community Prompt Parser')
    console.log('==========================')
    console.log(`📊 Processing up to ${limit} prompts`)
    console.log('')

    // Fetch prompts that need parsing
    const { data: prompts, error } = await supabase
      .from('community_prompts')
      .select('id, title, full_prompt_text')
      .is('veo3_prompt', null) // Only process unparsed prompts
      .limit(limit)

    if (error) {
      console.error('❌ Error fetching prompts:', error)
      return
    }

    if (!prompts || prompts.length === 0) {
      console.log('✅ No prompts found that need parsing!')
      return
    }

    console.log(`📄 Found ${prompts.length} prompts to parse`)
    console.log('')

    let successful = 0
    let failed = 0

    for (const [index, prompt] of prompts.entries()) {
      console.log(`📝 Processing ${index + 1}/${prompts.length}: ${prompt.title.substring(0, 50)}...`)
      
      try {
        // Parse the content
        const parsed = this.parseContent(prompt.full_prompt_text)
        
        // Update the database
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({
            veo3_prompt: parsed.veo3_prompt,
            clean_description: parsed.clean_description,
            extracted_tags: parsed.extracted_tags
          })
          .eq('id', prompt.id)

        if (updateError) {
          console.log(`   ❌ Database update failed: ${updateError.message}`)
          failed++
        } else {
          console.log(`   ✅ Parsed successfully`)
          console.log(`      🎯 Veo3 Prompt: ${parsed.veo3_prompt ? 'Found' : 'None'}`)
          console.log(`      📝 Description: ${parsed.clean_description ? 'Found' : 'None'}`)
          console.log(`      🏷️  Tags: ${parsed.extracted_tags.length} found`)
          successful++
        }
      } catch (parseError) {
        console.log(`   ❌ Parsing failed: ${parseError}`)
        failed++
      }
      
      console.log('')
    }

    console.log('📊 Parsing Complete!')
    console.log('====================')
    console.log(`✅ Successful: ${successful}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${((successful / prompts.length) * 100).toFixed(1)}%`)
  }

  async testParsing(promptId?: string): Promise<void> {
    console.log('🧪 Testing Prompt Parser')
    console.log('========================')
    
    let query = supabase
      .from('community_prompts')
      .select('id, title, full_prompt_text')

    if (promptId) {
      query = query.eq('id', promptId)
    } else {
      query = query.limit(1)
    }

    const { data: prompts, error } = await query

    if (error || !prompts || prompts.length === 0) {
      console.log('❌ No prompts found for testing')
      return
    }

    const prompt = prompts[0]
    console.log(`📝 Testing with: ${prompt.title}`)
    console.log('')

    console.log('🔍 Original content (first 300 chars):')
    console.log(prompt.full_prompt_text.substring(0, 300) + '...')
    console.log('')

    const parsed = this.parseContent(prompt.full_prompt_text)
    
    console.log('🎯 Parsed Results:')
    console.log('==================')
    console.log('Veo3 Prompt:')
    console.log(parsed.veo3_prompt || 'None found')
    console.log('')
    console.log('Clean Description:')
    console.log(parsed.clean_description || 'None found')
    console.log('')
    console.log('Extracted Tags:')
    console.log(parsed.extracted_tags.length > 0 ? parsed.extracted_tags.join(', ') : 'None found')
  }
}

// CLI interface
async function main() {
  const parser = new CommunityPromptParser()
  
  const command = process.argv[2] || 'parse'
  const limit = process.argv[3] ? parseInt(process.argv[3]) : 10
  
  if (command === 'test') {
    await parser.testParsing()
  } else if (command === 'parse') {
    await parser.parseAllPrompts(limit)
  } else {
    console.log('Usage:')
    console.log('  npm run parse-prompts test    # Test parsing on one prompt')
    console.log('  npm run parse-prompts parse [limit]  # Parse prompts (default: 10)')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export default CommunityPromptParser 