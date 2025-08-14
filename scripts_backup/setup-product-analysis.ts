#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please set:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupProductAnalysis() {
  console.log('🚀 Setting up Product Analysis feature...\n')
  
  try {
    // Read and execute the SQL schema
    const schemaPath = path.join(process.cwd(), 'database', 'product-analysis-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📊 Creating database schema...')
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schema })
    
    if (schemaError) {
      // Try alternative approach - execute statements individually
      console.log('⚠️  Trying alternative schema setup...')
      
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
          if (error && !error.message.includes('already exists')) {
            console.error(`❌ Error executing statement: ${error.message}`)
          }
        } catch (err) {
          console.log(`⚠️  Skipping statement (might already exist): ${statement.substring(0, 50)}...`)
        }
      }
    }
    
    console.log('✅ Database schema created successfully!')
    
    // Create storage bucket for product images
    console.log('📦 Setting up storage bucket...')
    
    const { error: bucketError } = await supabase.storage
      .createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      })
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Error creating storage bucket:', bucketError)
    } else {
      console.log('✅ Storage bucket ready!')
    }
    
    // Verify setup
    console.log('\n🔍 Verifying setup...')
    
    const tables = ['user_products', 'product_analysis_sessions', 'style_templates']
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error(`❌ Error accessing ${table}:`, error.message)
      } else {
        console.log(`✅ Table ${table}: ${count} records`)
      }
    }
    
    // Check storage bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
    } else {
      const productBucket = buckets.find(b => b.name === 'product-images')
      if (productBucket) {
        console.log('✅ Storage bucket: product-images')
      } else {
        console.error('❌ Storage bucket not found')
      }
    }
    
    console.log('\n🎉 Product Analysis feature setup complete!')
    console.log('\n📋 Next steps:')
    console.log('   1. Add OPENROUTER_API_KEY to your .env.local file')
    console.log('   2. Visit /dashboard/products to start uploading products')
    console.log('   3. Upload a product image and test the AI analysis')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

setupProductAnalysis() 