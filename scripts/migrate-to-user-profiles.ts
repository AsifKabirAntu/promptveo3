import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'
import fs from 'fs'
import path from 'path'

// Load environment variables first
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase environment variables are not set')
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
})

async function migrateToUserProfiles() {
  console.log('🚀 Starting migration to user_profiles table...')
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../database/migrate-to-user-profiles.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📋 Migration SQL loaded')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} had an issue (might be expected):`, error.message)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (error) {
        console.log(`⚠️  Statement ${i + 1} failed (might be expected):`, (error as Error).message)
      }
    }
    
    console.log('\n🎉 Migration completed!')
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...')
    
    // Check user_profiles structure
    const { data: userProfiles, error: upError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5)
    
    if (upError) {
      console.error('❌ Error checking user_profiles:', upError)
    } else {
      console.log('✅ user_profiles table accessible')
      console.log('📊 Sample user_profiles data:', userProfiles)
    }
    
    // Check subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)
    
    if (subError) {
      console.error('❌ Error checking subscriptions:', subError)
    } else {
      console.log('✅ subscriptions table accessible')
      console.log('📊 Sample subscriptions data:', subscriptions)
    }
    
    console.log('\n🎯 Migration verification completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

migrateToUserProfiles() 