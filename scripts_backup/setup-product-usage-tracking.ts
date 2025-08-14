import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupProductUsageTracking() {
  try {
    console.log('🚀 Setting up product usage tracking...')
    
    const sqlPath = path.join(process.cwd(), 'database', 'product-analysis-usage-tracking.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('\n📋 MANUAL SETUP REQUIRED:')
    console.log('=========================================')
    console.log('Due to SQL execution limitations, please run the following SQL manually in your Supabase SQL Editor:')
    console.log('\n1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Create a new query')
    console.log('4. Copy and paste the following SQL:')
    console.log('\n' + '='.repeat(80))
    console.log(sql)
    console.log('='.repeat(80))
    
    console.log('\n5. Execute the query')
    console.log('6. Verify that the following tables and functions were created:')
    console.log('   - Table: user_product_usage')
    console.log('   - Function: get_or_create_monthly_usage')
    console.log('   - Function: increment_upload_usage')
    console.log('   - Function: increment_prompt_generation_usage')
    console.log('   - Function: can_user_upload')
    console.log('   - Function: can_user_generate_prompt')
    
    // Test if we can connect to Supabase
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('\n❌ Supabase connection test failed:', error.message)
    } else {
      console.log('\n✅ Supabase connection successful')
    }
    
    console.log('\n📝 After running the SQL manually, you can test the setup by:')
    console.log('1. Going to your products page in the app')
    console.log('2. Checking that usage limits are displayed')
    console.log('3. Testing upload limits (1 for free, 20 for pro users)')
    console.log('4. Testing prompt generation limits (1 for free, 40 for pro users)')
    
    console.log('\n🎯 Setup instructions complete!')
    console.log('The product usage tracking system is ready once you run the SQL manually.')

  } catch (error) {
    console.error('Setup preparation failed:', error)
    process.exit(1)
  }
}

// Also provide a verification function
async function verifySetup() {
  try {
    console.log('🔍 Verifying product usage tracking setup...')
    
    // Check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_product_usage')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.log('❌ user_product_usage table not found. Please run the SQL setup first.')
      return false
    }
    
    console.log('✅ user_product_usage table exists')
    
    // Check if functions exist by trying to call them
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_or_create_monthly_usage', { user_uuid: user.id })
      
      if (usageError) {
        console.log('❌ get_or_create_monthly_usage function not found')
        return false
      }
      
      console.log('✅ get_or_create_monthly_usage function works')
      console.log('📊 Current usage:', usageData)
    } else {
      console.log('⚠️ No authenticated user, skipping function tests')
    }
    
    console.log('✅ Product usage tracking setup verified!')
    return true
    
  } catch (error) {
    console.error('Verification failed:', error)
    return false
  }
}

if (process.argv.includes('--verify')) {
  verifySetup()
} else {
  setupProductUsageTracking()
} 