import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createProfileForUser() {
  const userId = '13b124ce-aaee-4dcc-a256-fa26f02cd3ee' // Current user ID
  const userEmail = 'info@promptveo3.com'
  const userName = 'Prompt Veo3'

  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('Error checking profile:', checkError)
      return
    }

    if (existingProfile) {
      console.log('Profile already exists:', existingProfile)
      return
    }

    // Create profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: userEmail,
        name: userName,
        plan: 'free'
      })
      .select()
      .single()

    if (error) {
      console.log('Error creating profile:', error)
      return
    }

    console.log('Profile created successfully:', profile)
  } catch (error) {
    console.log('Error:', error)
  }
}

createProfileForUser() 