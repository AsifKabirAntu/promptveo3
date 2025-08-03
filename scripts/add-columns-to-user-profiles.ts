import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

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

async function addColumnsToUserProfiles() {
  console.log('🔧 Adding missing columns to user_profiles table...')
  
  try {
    // Check current structure
    console.log('📋 Checking current user_profiles structure...')
    const { data: currentData, error: currentError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (currentError) {
      console.error('❌ Error checking current structure:', currentError)
      return
    }
    
    console.log('📊 Current columns:', Object.keys(currentData[0] || {}))
    
    // Try to add missing columns one by one
    const columnsToAdd = [
      { name: 'email', type: 'TEXT' },
      { name: 'avatar_url', type: 'TEXT' },
      { name: 'plan', type: 'TEXT DEFAULT \'free\' CHECK (plan IN (\'free\', \'pro\'))' },
      { name: 'subscription_id', type: 'TEXT' },
      { name: 'subscription_status', type: 'TEXT' }
    ]
    
    for (const column of columnsToAdd) {
      console.log(`\n🔄 Adding column: ${column.name}`)
      
      try {
        // Try to add the column
        const { error } = await supabase
          .from('user_profiles')
          .select(column.name)
          .limit(1)
        
        if (error && error.message.includes('does not exist')) {
          console.log(`⚠️  Column ${column.name} doesn't exist, but we can't add it via client`)
          console.log(`   You'll need to add it manually in Supabase dashboard or SQL editor`)
        } else {
          console.log(`✅ Column ${column.name} already exists`)
        }
      } catch (error) {
        console.log(`⚠️  Could not check column ${column.name}:`, (error as Error).message)
      }
    }
    
    // Update existing user_profiles with data from profiles table
    console.log('\n🔄 Migrating data from profiles to user_profiles...')
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }
    
    console.log(`📊 Found ${profiles?.length || 0} profiles to migrate`)
    
    // Update each user_profile with corresponding profile data
    for (const profile of profiles || []) {
      console.log(`\n🔄 Updating user_profile for user: ${profile.id}`)
      
      const updateData: any = {}
      
      // Only update fields that exist in user_profiles
      if (profile.email) updateData.email = profile.email
      if (profile.name) updateData.full_name = profile.name
      if (profile.avatar_url) updateData.avatar_url = profile.avatar_url
      if (profile.plan) updateData.plan = profile.plan
      if (profile.subscription_id) updateData.subscription_id = profile.subscription_id
      if (profile.subscription_status) updateData.subscription_status = profile.subscription_status
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', profile.id)
        
        if (updateError) {
          console.error(`❌ Error updating user_profile for ${profile.id}:`, updateError)
        } else {
          console.log(`✅ Updated user_profile for ${profile.id}`)
        }
      }
    }
    
    console.log('\n🎉 Column addition and data migration completed!')
    
    // Verify the final structure
    console.log('\n🔍 Verifying final structure...')
    const { data: finalData, error: finalError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3)
    
    if (finalError) {
      console.error('❌ Error checking final structure:', finalError)
    } else {
      console.log('✅ Final user_profiles structure:')
      console.log('📊 Sample data:', finalData)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

addColumnsToUserProfiles() 