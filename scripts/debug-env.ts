import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const envPath = resolve(process.cwd(), '.env.local')

console.log('🔍 Debugging .env.local file\n')
console.log('📁 File path:', envPath)
console.log('\n📄 File contents:')
console.log('---START---')
try {
  const content = readFileSync(envPath, 'utf-8')
  console.log(content)
  console.log('---END---')
  console.log(`\n📊 File length: ${content.length} characters`)
  console.log(`📊 Lines: ${content.split('\n').length}`)
} catch (error: any) {
  console.log('❌ Error reading file:', error.message)
}

console.log('\n🔧 Loading with dotenv...')
const result = config({ path: envPath })

if (result.error) {
  console.log('❌ Dotenv error:', result.error)
} else {
  console.log('✅ Dotenv loaded')
  console.log('📦 Parsed:', result.parsed)
}

console.log('\n🌍 Environment variables:')
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Found' : '❌ Not found')
console.log('Value:', process.env.RESEND_API_KEY || 'undefined')
