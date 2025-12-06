import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nMake sure these are set in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Prompt {
  id: string
  title: string
  description: string
  full_prompt_text: string
  veo3_prompt: string
  category: string
  tags: string[]
  style: string
  created_at: string
}

function generatePromptText(prompt: any): string {
  const parts: string[] = []
  
  if (prompt.style) parts.push(`Style: ${prompt.style}`)
  if (prompt.camera) parts.push(`Camera: ${prompt.camera}`)
  if (prompt.lighting) parts.push(`Lighting: ${prompt.lighting}`)
  if (prompt.environment) parts.push(`Environment: ${prompt.environment}`)
  if (prompt.elements && prompt.elements.length > 0) {
    parts.push(`Elements: ${prompt.elements.join(', ')}`)
  }
  if (prompt.motion) parts.push(`Motion: ${prompt.motion}`)
  if (prompt.ending) parts.push(`Ending: ${prompt.ending}`)
  if (prompt.text && prompt.text !== 'none') parts.push(`Text: ${prompt.text}`)
  if (prompt.timeline) parts.push(`Timeline: ${prompt.timeline}`)
  
  return parts.join('\n')
}

async function exportPromptsToMarkdown() {
  console.log('📚 Fetching all prompts from database...')

  // Fetch regular prompts
  const { data: regularPrompts, error: regularError } = await supabase
    .from('prompts')
    .select('*')
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  if (regularError) {
    console.error('❌ Error fetching regular prompts:', regularError)
  }

  // Fetch community prompts
  const { data: communityPrompts, error: communityError } = await supabase
    .from('community_prompts')
    .select('*')
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  if (communityError) {
    console.error('❌ Error fetching community prompts:', communityError)
  }

  // Fetch timeline prompts
  const { data: timelinePrompts, error: timelineError } = await supabase
    .from('timeline_prompts')
    .select('*')
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  if (timelineError) {
    console.error('❌ Error fetching timeline prompts:', timelineError)
  }

  // Combine all prompts
  const allPrompts: Prompt[] = []
  
  if (regularPrompts) {
    regularPrompts.forEach((p: any) => {
      allPrompts.push({
        id: p.id,
        title: p.title,
        description: p.description || '',
        full_prompt_text: generatePromptText(p),
        veo3_prompt: generatePromptText(p),
        category: p.category || 'Regular Prompts',
        tags: p.keywords || [],
        style: p.style || '',
        created_at: p.created_at
      })
    })
  }

  if (communityPrompts) {
    communityPrompts.forEach((p: any) => {
      allPrompts.push({
        id: p.id,
        title: p.title,
        description: p.description || '',
        full_prompt_text: p.full_prompt_text || p.veo3_prompt || '',
        veo3_prompt: p.veo3_prompt || p.full_prompt_text || '',
        category: 'Community - ' + (p.category || 'General'),
        tags: p.tags || [],
        style: p.style || '',
        created_at: p.created_at
      })
    })
  }

  if (timelinePrompts) {
    timelinePrompts.forEach((p: any) => {
      allPrompts.push({
        id: p.id,
        title: p.title,
        description: p.description || '',
        full_prompt_text: p.full_prompt || '',
        veo3_prompt: p.full_prompt || '',
        category: 'Timeline - ' + (p.category || 'General'),
        tags: p.tags || [],
        style: p.base_style || '',
        created_at: p.created_at
      })
    })
  }

  if (allPrompts.length === 0) {
    console.log('⚠️  No prompts found in any table')
    return
  }

  console.log(`✅ Found ${allPrompts.length} total prompts`)
  console.log(`   - Regular: ${regularPrompts?.length || 0}`)
  console.log(`   - Community: ${communityPrompts?.length || 0}`)
  console.log(`   - Timeline: ${timelinePrompts?.length || 0}`)

  const prompts = allPrompts

  // Group prompts by category
  const promptsByCategory: { [key: string]: Prompt[] } = {}
  
  prompts.forEach((prompt: Prompt) => {
    const category = prompt.category || 'Uncategorized'
    if (!promptsByCategory[category]) {
      promptsByCategory[category] = []
    }
    promptsByCategory[category].push(prompt)
  })

  // Generate markdown content with CSS for better PDF rendering
  let markdown = `---
title: "PromptVeo3 - Complete Prompt Library"
author: "PromptVeo3"
date: "${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}"
geometry: margin=1in
fontsize: 10pt
linestretch: 1.15
---

<style>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 9pt;
  line-height: 1.3;
  background-color: #f5f5f5;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  page-break-inside: avoid;
  overflow-wrap: break-word;
}
code {
  font-family: 'Courier New', monospace;
  font-size: 9pt;
}
h1, h2, h3 {
  page-break-after: avoid;
}
</style>

# PromptVeo3 - Complete Prompt Library

**Total Prompts:** ${prompts.length}

**Categories:** ${Object.keys(promptsByCategory).length}

**Generated:** ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}

---

`

  // Table of Contents
  markdown += `## Table of Contents\n\n`
  Object.keys(promptsByCategory).sort().forEach((category, index) => {
    const count = promptsByCategory[category].length
    markdown += `${index + 1}. [${category}](#${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}) (${count} prompts)\n`
  })
  markdown += `\n---\n\n`

  // Add each category and its prompts
  Object.keys(promptsByCategory).sort().forEach((category) => {
    const categoryPrompts = promptsByCategory[category]
    
    markdown += `## ${category}\n\n`
    markdown += `**${categoryPrompts.length} prompts in this category**\n\n`
    markdown += `---\n\n`

    categoryPrompts.forEach((prompt, index) => {
      markdown += `### ${index + 1}. ${prompt.title}\n\n`
      
      if (prompt.description) {
        // Escape any special markdown characters in description
        const cleanDescription = prompt.description.replace(/\\/g, '\\\\').replace(/`/g, '\\`')
        markdown += `**Description:** ${cleanDescription}\n\n`
      }

      if (prompt.style) {
        markdown += `**Style:** ${prompt.style}\n\n`
      }

      if (prompt.tags && prompt.tags.length > 0) {
        markdown += `**Tags:** ${prompt.tags.join(', ')}\n\n`
      }

      // Display the Veo3 prompt
      const promptText = prompt.veo3_prompt || prompt.full_prompt_text
      if (promptText) {
        markdown += `**Veo3 Prompt:**\n\n`
        // Use indented code blocks (4 spaces) which work better with PDF conversion
        // Split into lines and indent each line
        const lines = promptText.trim().split('\n')
        lines.forEach(line => {
          markdown += `    ${line}\n`
        })
        markdown += `\n`
      }

      markdown += `---\n\n`
    })

    markdown += `\n\n`
  })

  // Save to file
  const outputDir = path.join(process.cwd(), 'exports')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `promptveo3-library-${timestamp}.md`
  const filepath = path.join(outputDir, filename)

  fs.writeFileSync(filepath, markdown, 'utf-8')

  console.log(`\n✅ Markdown file created: ${filepath}`)
  console.log(`\n📊 Summary:`)
  console.log(`   - Total Prompts: ${prompts.length}`)
  console.log(`   - Categories: ${Object.keys(promptsByCategory).length}`)
  console.log(`\n📝 Category Breakdown:`)
  Object.keys(promptsByCategory).sort().forEach(category => {
    console.log(`   - ${category}: ${promptsByCategory[category].length} prompts`)
  })

  console.log(`\n💡 Next steps:`)
  console.log(`   1. Open the markdown file: ${filepath}`)
  console.log(`   2. Convert to PDF using:`)
  console.log(`      - Pandoc: pandoc ${filename} -o promptveo3-library.pdf`)
  console.log(`      - Or use an online converter like https://www.markdowntopdf.com/`)
  console.log(`      - Or open in VS Code and use "Markdown PDF" extension`)
}

exportPromptsToMarkdown().catch(console.error)

