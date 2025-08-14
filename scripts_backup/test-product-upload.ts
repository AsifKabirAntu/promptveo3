#!/usr/bin/env npx tsx

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../src/types/database'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function testProductAnalysisSetup() {
  console.log('🧪 Testing Product Analysis Setup...\n')

  // 1. Test database connection
  console.log('1. Testing database connection...')
  try {
    const { data, error } = await supabase.from('user_products').select('count').limit(1)
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      console.log('💡 Solution: Run the SQL from database/product-analysis-complete.sql in your Supabase dashboard')
      return false
    }
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection error:', error)
    return false
  }

  // 2. Test storage bucket
  console.log('\n2. Testing storage bucket...')
  try {
    const { data, error } = await supabase.storage.getBucket('product-images')
    if (error) {
      console.log('⚠️ Storage bucket does not exist, attempting to create...')
      
      const { error: createError } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      })
      
      if (createError) {
        console.error('❌ Failed to create storage bucket:', createError.message)
        console.log('💡 Solution: Create the bucket manually in your Supabase dashboard > Storage')
        return false
      }
      console.log('✅ Storage bucket created successfully')
    } else {
      console.log('✅ Storage bucket exists')
    }
  } catch (error) {
    console.error('❌ Storage bucket error:', error)
    return false
  }

  // 3. Test style templates
  console.log('\n3. Testing style templates...')
  try {
    const { data, error } = await supabase.from('style_templates').select('*')
    if (error) {
      console.error('❌ Style templates table error:', error.message)
      return false
    }
    if (!data || data.length === 0) {
      console.log('⚠️ No style templates found')
      console.log('💡 Solution: The default templates should be inserted via the SQL script')
      return false
    }
    console.log(`✅ Found ${data.length} style templates`)
  } catch (error) {
    console.error('❌ Style templates error:', error)
    return false
  }

  // 4. Test required tables
  console.log('\n4. Testing required tables...')
  const tables = ['user_products', 'product_analysis_sessions', 'style_templates']
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table as any).select('count').limit(1)
      if (error) {
        console.error(`❌ Table '${table}' not accessible:`, error.message)
        return false
      }
      console.log(`✅ Table '${table}' exists and accessible`)
    } catch (error) {
      console.error(`❌ Table '${table}' error:`, error)
      return false
    }
  }

  console.log('\n🎉 All checks passed! Product Analysis feature is ready to use.')
  console.log('\n📋 Next steps:')
  console.log('   1. Visit http://localhost:3000/dashboard/products')
  console.log('   2. Try uploading a product image')
  console.log('   3. Generate AI prompts!')
  
  return true
}

testProductAnalysisSetup()
  .then(success => {
    if (!success) {
      console.log('\n💻 Setup Guide:')
      console.log('   1. Go to your Supabase Dashboard > SQL Editor')
      console.log('   2. Run: database/product-analysis-complete.sql')
      console.log('   3. Run this test again: npm run tsx scripts/test-product-upload.ts')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }) 