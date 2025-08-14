import { createClient } from '@supabase/supabase-js'
import { Database } from '../src/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function testUsageTracking() {
  console.log('🧪 Testing Usage Tracking System...\n')

  try {
    // 1. Test if the user_product_usage table exists
    console.log('1. Checking if user_product_usage table exists...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_product_usage')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Table check failed:', tableError)
      return
    }
    console.log('✅ user_product_usage table exists\n')

    // 2. Test if the RPC functions exist
    console.log('2. Testing RPC functions...')
    
    // Test get_or_create_monthly_usage
    try {
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_or_create_monthly_usage', { user_uuid: 'test-user-id' })
      
      if (usageError) {
        console.error('❌ get_or_create_monthly_usage failed:', usageError)
      } else {
        console.log('✅ get_or_create_monthly_usage function works')
      }
    } catch (error) {
      console.error('❌ get_or_create_monthly_usage error:', error)
    }

    // Test can_user_upload
    try {
      const { data: canUpload, error: uploadError } = await supabase
        .rpc('can_user_upload', { user_uuid: 'test-user-id', user_plan: 'free' })
      
      if (uploadError) {
        console.error('❌ can_user_upload failed:', uploadError)
      } else {
        console.log('✅ can_user_upload function works')
      }
    } catch (error) {
      console.error('❌ can_user_upload error:', error)
    }

    // Test can_user_generate_prompt
    try {
      const { data: canGenerate, error: generateError } = await supabase
        .rpc('can_user_generate_prompt', { user_uuid: 'test-user-id', user_plan: 'free' })
      
      if (generateError) {
        console.error('❌ can_user_generate_prompt failed:', generateError)
      } else {
        console.log('✅ can_user_generate_prompt function works')
      }
    } catch (error) {
      console.error('❌ can_user_generate_prompt error:', error)
    }

    // 3. Check current usage records
    console.log('\n3. Checking current usage records...')
    const { data: usageRecords, error: recordsError } = await supabase
      .from('user_product_usage')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recordsError) {
      console.error('❌ Failed to fetch usage records:', recordsError)
    } else {
      console.log(`✅ Found ${usageRecords?.length || 0} usage records`)
      if (usageRecords && usageRecords.length > 0) {
        console.log('Latest records:')
        usageRecords.forEach((record, index) => {
          console.log(`  ${index + 1}. User: ${record.user_id}, Month: ${record.month_year}, Uploads: ${record.uploads_used}, Prompts: ${record.prompts_generated}`)
        })
      }
    }

    // 4. Test with a real user (if any exist)
    console.log('\n4. Testing with real users...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, plan')
      .limit(3)

    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError)
    } else if (users && users.length > 0) {
      console.log(`✅ Found ${users.length} users to test with`)
      
      for (const user of users) {
        console.log(`\nTesting user: ${user.id} (${user.plan} plan)`)
        
        try {
          const { data: userUsage, error: userUsageError } = await supabase
            .rpc('get_or_create_monthly_usage', { user_uuid: user.id })
          
          if (userUsageError) {
            console.error(`  ❌ Failed to get usage for user ${user.id}:`, userUsageError)
          } else {
            console.log(`  ✅ User usage: Uploads ${userUsage.uploads_used}, Prompts ${userUsage.prompts_generated}`)
          }
        } catch (error) {
          console.error(`  ❌ Error testing user ${user.id}:`, error)
        }
      }
    } else {
      console.log('ℹ️  No users found to test with')
    }

    console.log('\n🎉 Usage tracking test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testUsageTracking()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }) 