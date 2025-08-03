import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugBlackDashboard() {
  console.log('=== Debugging Black Dashboard Issue ===\n')
  
  // Step 1: Check environment variables
  console.log('1. Environment Variables:')
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables')
    return
  }
  
  // Step 2: Test Supabase connection
  console.log('\n2. Testing Supabase Connection:')
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection error:', error)
    } else {
      console.log('✅ Supabase connection successful')
    }
  } catch (err) {
    console.error('❌ Unexpected connection error:', err)
  }
  
  // Step 3: Check current session
  console.log('\n3. Current Session State:')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('❌ Session error:', sessionError)
  } else {
    console.log(session ? '✅ Active session found' : 'ℹ️  No active session')
    if (session) {
      console.log(`   User ID: ${session.user.id}`)
      console.log(`   Email: ${session.user.email}`)
      console.log(`   User metadata: ${JSON.stringify(session.user.user_metadata, null, 2)}`)
    }
  }
  
  // Step 4: Test auth state listener
  console.log('\n4. Testing Auth State Listener:')
  let authEvents: string[] = []
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    authEvents.push(event)
    console.log(`   🔄 Auth event: ${event}`)
    if (session) {
      console.log(`      User: ${session.user.email}`)
      console.log(`      Metadata: ${JSON.stringify(session.user.user_metadata, null, 2)}`)
    } else {
      console.log('      No session')
    }
  })
  
  // Step 5: Test prompts data fetching
  console.log('\n5. Testing Prompts Data Fetching:')
  try {
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .limit(5)
    
    if (promptsError) {
      console.error('❌ Error fetching prompts:', promptsError)
    } else {
      console.log(`✅ Successfully fetched ${prompts?.length || 0} prompts`)
      if (prompts && prompts.length > 0) {
        console.log(`   First prompt: ${prompts[0].title}`)
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error fetching prompts:', err)
  }
  
  // Step 6: Test timeline prompts data fetching
  console.log('\n6. Testing Timeline Prompts Data Fetching:')
  try {
    const { data: timelinePrompts, error: timelineError } = await supabase
      .from('timeline_prompts')
      .select('*')
      .limit(5)
    
    if (timelineError) {
      console.error('❌ Error fetching timeline prompts:', timelineError)
    } else {
      console.log(`✅ Successfully fetched ${timelinePrompts?.length || 0} timeline prompts`)
      if (timelinePrompts && timelinePrompts.length > 0) {
        console.log(`   First timeline prompt: ${timelinePrompts[0].title}`)
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error fetching timeline prompts:', err)
  }
  
  // Step 7: Test categories and styles fetching
  console.log('\n7. Testing Categories and Styles:')
  try {
    const { data: categories, error: catError } = await supabase
      .from('prompts')
      .select('category')
      .not('category', 'is', null)
    
    if (catError) {
      console.error('❌ Error fetching categories:', catError)
    } else {
      const uniqueCategories = [...new Set(categories?.map(p => p.category) || [])]
      console.log(`✅ Found ${uniqueCategories.length} unique categories`)
      console.log(`   Categories: ${uniqueCategories.slice(0, 5).join(', ')}${uniqueCategories.length > 5 ? '...' : ''}`)
    }
  } catch (err) {
    console.error('❌ Unexpected error fetching categories:', err)
  }
  
  // Clean up listener
  setTimeout(() => {
    subscription.unsubscribe()
    console.log('\n   Auth state listener cleaned up')
  }, 3000)
  
  console.log('\n=== Debug Complete ===')
  console.log('\nPotential Issues and Solutions:')
  console.log('\n1. If no session found:')
  console.log('   - Sign in through the browser first')
  console.log('   - Check browser console for errors')
  console.log('   - Verify OAuth is configured correctly')
  
  console.log('\n2. If prompts not loading:')
  console.log('   - Check database connection')
  console.log('   - Verify prompts table exists and has data')
  console.log('   - Check RLS policies')
  
  console.log('\n3. If auth events not firing:')
  console.log('   - Check browser console for JavaScript errors')
  console.log('   - Verify auth provider is properly initialized')
  console.log('   - Check for network connectivity issues')
  
  console.log('\n4. If dashboard is black:')
  console.log('   - Check browser console for React errors')
  console.log('   - Verify all components are loading')
  console.log('   - Check for CSS/styling issues')
  
  console.log(`\nAuth events captured: ${authEvents.join(', ')}`)
}

debugBlackDashboard().catch(console.error) 