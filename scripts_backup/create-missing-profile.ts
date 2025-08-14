import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMissingProfile() {
  console.log('=== Creating missing profile for current user ===')
  
  const userId = '13b124ce-aaee-4dcc-a256-fa26f02cd3ee' // Current user from logs
  
  try {
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', checkError)
      return
    }
    
    if (existingProfile) {
      console.log('✅ Profile already exists for user:', userId)
      return
    }
    
    // Create profile entry with known information
    const profileData = {
      id: userId,
      email: 'info@promptveo3.com', // From user_profiles table
      name: 'Prompt Veo3', // From user_profiles table
      avatar_url: null,
      plan: 'free',
      subscription_id: null,
      subscription_status: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating profile:', createError)
      return
    }
    
    console.log('✅ Created profile for user:', userId)
    console.log('Profile data:', newProfile)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createMissingProfile() 