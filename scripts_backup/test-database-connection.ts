import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = envContent
  .split('\n')
  .filter(line => line.trim() !== '' && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, value] = line.split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test 1: Check auth status
    console.log('\n1. Testing auth status...')
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth error:', authError)
    } else {
      console.log('✅ Auth check successful')
      console.log('Session:', session ? 'Present' : 'Not present')
      if (session) {
        console.log('User:', session.user.email)
      }
    }
    
    // Test 2: Try to fetch prompts
    console.log('\n2. Testing prompts table access...')
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('id, title')
      .limit(5)
    
    if (promptsError) {
      console.error('❌ Prompts error:', promptsError)
    } else {
      console.log('✅ Prompts fetch successful')
      console.log('Prompts count:', prompts?.length || 0)
      if (prompts && prompts.length > 0) {
        console.log('First prompt:', prompts[0])
      }
    }
    
    // Test 3: Try to fetch timeline prompts
    console.log('\n3. Testing timeline_prompts table access...')
    const { data: timelinePrompts, error: timelinePromptsError } = await supabase
      .from('timeline_prompts')
      .select('id, title')
      .limit(5)
    
    if (timelinePromptsError) {
      console.error('❌ Timeline prompts error:', timelinePromptsError)
    } else {
      console.log('✅ Timeline prompts fetch successful')
      console.log('Timeline prompts count:', timelinePrompts?.length || 0)
      if (timelinePrompts && timelinePrompts.length > 0) {
        console.log('First timeline prompt:', timelinePrompts[0])
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testDatabaseConnection() 