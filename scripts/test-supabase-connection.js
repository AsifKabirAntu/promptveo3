/**
 * Test Supabase connection and diagnose issues
 * @fileoverview This script tests various aspects of the Supabase connection
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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
  }, {})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')
  console.log('Supabase Service Key:', supabaseServiceKey ? 'Present' : 'Missing')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables')
    return
  }

  try {
    // Create both anon and service role clients for testing
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const supabaseAdmin = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null
    
    // Test 1: Basic connection test
    console.log('\n1. Testing basic connection to Supabase...')
    const start = Date.now()
    const { data: health, error: healthError } = await supabase.from('prompts').select('id').limit(1)
    const duration = Date.now() - start
    
    if (healthError) {
      console.error('❌ Connection error:', healthError)
    } else {
      console.log(`✅ Connection successful (${duration}ms)`)
    }

    // Test 1b: Direct data fetch test
    console.log('\n1b. Testing direct data fetch...')
    try {
      const startDirect = Date.now()
      const response = await fetch(`${supabaseUrl}/rest/v1/prompts?select=id&limit=1`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })
      const durationDirect = Date.now() - startDirect
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Direct fetch successful (${durationDirect}ms)`)
        console.log(`Data: ${JSON.stringify(data)}`)
      } else {
        console.error(`❌ Direct fetch failed: ${response.status} ${response.statusText}`)
      }
    } catch (e) {
      console.error('❌ Error with direct fetch:', e)
    }
    
    // Test 2: Check for rate limiting
    console.log('\n2. Testing for rate limiting issues...')
    const results = []
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now()
      const { data, error } = await supabase.from('prompts').select('id').limit(1)
      const endTime = Date.now()
      
      results.push({
        attempt: i + 1,
        duration: endTime - startTime,
        success: !error,
        error: error ? error.message : null
      })
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log('Rate limiting test results:')
    console.table(results)
    
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
    const failureCount = results.filter(r => !r.success).length
    
    if (failureCount > 0) {
      console.error(`❌ ${failureCount} requests failed - possible rate limiting`)
    } else if (avgDuration > 1000) {
      console.warn(`⚠️ Average response time is high: ${avgDuration.toFixed(0)}ms`)
    } else {
      console.log(`✅ No rate limiting detected. Average response time: ${avgDuration.toFixed(0)}ms`)
    }
    
    // Test 3: Check database schema
    console.log('\n3. Testing database schema...')
    const tables = ['prompts', 'timeline_prompts', 'subscriptions', 'prices', 'products']
    
    for (const table of tables) {
      const startTime = Date.now()
      const { data, error } = await supabase.from(table).select('id').limit(1)
      const endTime = Date.now()
      
      console.log(`Table '${table}': ${error ? '❌ Error' : '✅ OK'} (${endTime - startTime}ms)`)
      if (error) {
        console.error(`  Error details: ${error.message}`)
      } else {
        console.log(`  Data: ${JSON.stringify(data)}`)
      }
    }
    
    // Test 4: Check RLS policies
    if (supabaseAdmin) {
      console.log('\n4. Testing RLS policies...')
      
      // Get RLS policies
      const { data: policies, error: policiesError } = await supabaseAdmin.rpc('get_policies')
      
      if (policiesError) {
        console.error('❌ Error fetching RLS policies:', policiesError)
      } else if (policies && policies.length > 0) {
        console.log('✅ RLS policies found:')
        console.table(policies.map(p => ({
          table: p.tablename,
          policy: p.policyname,
          roles: p.roles,
          cmd: p.cmd,
          permissive: p.permissive === 'PERMISSIVE' ? 'Yes' : 'No'
        })))
      } else {
        console.warn('⚠️ No RLS policies found - this might cause permission issues')
      }
    }
    
    // Test 5: Check network connectivity
    console.log('\n5. Testing network connectivity...')
    const networkStart = Date.now()
    const pingResponse = await fetch(`${supabaseUrl}/ping`)
    const networkDuration = Date.now() - networkStart
    
    if (pingResponse.ok) {
      console.log(`✅ Network connectivity OK (${networkDuration}ms)`)
    } else {
      console.error(`❌ Network connectivity issues: ${pingResponse.status} ${pingResponse.statusText}`)
    }
    
    // Test 6: Check for CORS issues
    console.log('\n6. Testing CORS configuration...')
    try {
      const corsResponse = await fetch(`${supabaseUrl}/rest/v1/prompts?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Origin': 'http://localhost:3000'
        }
      })
      
      if (corsResponse.ok) {
        console.log('✅ CORS configuration appears correct for localhost')
      } else {
        console.error(`❌ CORS issue detected: ${corsResponse.status} ${corsResponse.statusText}`)
      }
      
      // Also test production origin
      const productionCorsResponse = await fetch(`${supabaseUrl}/rest/v1/prompts?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Origin': 'https://www.promptveo3.com'
        }
      })
      
      if (productionCorsResponse.ok) {
        console.log('✅ CORS configuration appears correct for production domain')
      } else {
        console.error(`❌ CORS issue detected for production domain: ${productionCorsResponse.status} ${productionCorsResponse.statusText}`)
      }
    } catch (e) {
      console.error('❌ Error testing CORS:', e)
    }
    
    // Test 7: Check for connection pool issues
    console.log('\n7. Testing for connection pool saturation...')
    const concurrentRequests = 10
    const concurrentResults = await Promise.allSettled(
      Array(concurrentRequests).fill(0).map((_, i) => 
        supabase.from('prompts').select('id').limit(1)
      )
    )
    
    const successfulConcurrent = concurrentResults.filter(r => r.status === 'fulfilled').length
    console.log(`✅ ${successfulConcurrent}/${concurrentRequests} concurrent requests succeeded`)
    
    if (successfulConcurrent < concurrentRequests) {
      console.warn('⚠️ Some concurrent requests failed - possible connection pool issues')
      concurrentResults
        .filter(r => r.status === 'rejected')
        .forEach((r, i) => console.error(`  Request ${i} failed:`, r.reason))
    }
    
    console.log('\n✅ Supabase connection tests completed')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testSupabaseConnection() 