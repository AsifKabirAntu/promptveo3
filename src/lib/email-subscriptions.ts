import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

export interface EmailSubscription {
  id: string
  email: string
  created_at: string
  updated_at: string
  is_active: boolean
  source: string
}

export async function subscribeToNewsletter(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address' }
    }

    const { data, error } = await supabase
      .from('email_subscriptions')
      .insert({
        email: email.toLowerCase().trim(),
        source: 'landing_page'
      })
      .select()
      .single()

    if (error) {
      // Check if it's a unique constraint violation (email already exists)
      if (error.code === '23505') {
        return { success: false, error: 'This email is already subscribed to our newsletter' }
      }
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error subscribing to newsletter:', error)
    return { 
      success: false, 
      error: 'Failed to subscribe. Please try again later.' 
    }
  }
}

export async function checkEmailSubscription(email: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('email_subscriptions')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .maybeSingle()

    return !!data
  } catch (error) {
    console.error('Error checking email subscription:', error)
    return false
  }
} 