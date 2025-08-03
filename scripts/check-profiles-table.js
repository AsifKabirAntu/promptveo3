/**
 * Check profiles table structure and data
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

async function checkProfilesTable() {
  console.log('🔍 Checking profiles table...')
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
    
    // 1. Check if profiles table exists
    console.log('\n1. Checking if profiles table exists...')
    const { data: tableExists, error: tableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Error checking profiles table:', tableError)
      return
    }
    
    console.log('✅ Profiles table exists')
    
    // 2. Get table structure using service role
    if (supabaseAdmin) {
      console.log('\n2. Getting profiles table structure...')
      try {
        const { data: columns, error: columnsError } = await supabaseAdmin.rpc('get_table_columns', { 
          table_name: 'profiles' 
        })
        
        if (columnsError) {
          console.error('❌ Error getting table structure:', columnsError)
          
          // Try a direct query to get column names
          console.log('Trying alternative method to get column names...')
          const { data: sample, error: sampleError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .limit(1)
            
          if (sampleError) {
            console.error('❌ Error getting sample data:', sampleError)
          } else if (sample && sample.length > 0) {
            console.log('✅ Column names from sample data:')
            console.log(Object.keys(sample[0]))
          } else {
            console.log('⚠️ No sample data found')
          }
        } else {
          console.log('✅ Table columns:')
          console.table(columns)
        }
      } catch (e) {
        console.error('❌ Error with RPC call:', e)
      }
    }
    
    // 3. Check direct API access
    console.log('\n3. Testing direct API access to profiles table...')
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&limit=5`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Direct API access successful. Found ${data.length} profiles`)
        
        if (data.length > 0) {
          console.log('Sample profile:')
          console.log(JSON.stringify(data[0], null, 2))
        }
      } else {
        console.error(`❌ Direct API access failed: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.error('Error details:', errorText)
      }
    } catch (e) {
      console.error('❌ Error with direct API access:', e)
    }
    
    // 4. Try to find a specific user
    console.log('\n4. Looking for user with ID 13b124ce-aaee-4dcc-a256-fa26f02cd3ee...')
    try {
      // Try with service role first
      if (supabaseAdmin) {
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', '13b124ce-aaee-4dcc-a256-fa26f02cd3ee')
        
        if (adminError) {
          console.error('❌ Error finding user with admin client:', adminError)
        } else if (adminData && adminData.length > 0) {
          console.log('✅ Found user with admin client:')
          console.log(JSON.stringify(adminData[0], null, 2))
        } else {
          console.log('⚠️ User not found with admin client')
        }
      }
      
      // Try with anon client
      const { data: anonData, error: anonError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', '13b124ce-aaee-4dcc-a256-fa26f02cd3ee')
      
      if (anonError) {
        console.error('❌ Error finding user with anon client:', anonError)
      } else if (anonData && anonData.length > 0) {
        console.log('✅ Found user with anon client:')
        console.log(JSON.stringify(anonData[0], null, 2))
      } else {
        console.log('⚠️ User not found with anon client')
      }
      
      // Try direct API access
      const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.13b124ce-aaee-4dcc-a256-fa26f02cd3ee&select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          console.log('✅ Found user with direct API:')
          console.log(JSON.stringify(data[0], null, 2))
        } else {
          console.log('⚠️ User not found with direct API')
        }
      } else {
        console.error(`❌ Direct API access failed: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.error('Error details:', errorText)
      }
    } catch (e) {
      console.error('❌ Error looking for specific user:', e)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkProfilesTable() 