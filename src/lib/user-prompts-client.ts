import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

export interface UserPrompt {
  id: string
  user_id: string
  prompt_type: 'regular' | 'timeline'
  title: string
  description: string
  category: string
  is_public: boolean
  is_featured: boolean
  
  // Regular prompt fields
  style?: string
  camera?: string
  lighting?: string
  environment?: string
  elements?: string[]
  motion?: string
  ending?: string
  text?: string
  keywords?: string[]
  timeline?: string
  
  // Timeline prompt fields
  base_style?: string
  aspect_ratio?: string
  scene_description?: string
  camera_setup?: string
  negative_prompts?: string[]
  timeline_sequence?: {
    sequence: number
    timestamp: string
    action: string
    audio: string
  }[]
  
  // Metadata
  likes_count: number
  usage_count: number
  created_at: string
  updated_at: string
}

export async function getUserPrompts(): Promise<UserPrompt[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_prompts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user prompts:', error)
    return []
  }

  return data || []
}

export async function createUserPrompt(promptData: Partial<UserPrompt>): Promise<UserPrompt | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_prompts')
    .insert({
      ...promptData,
      user_id: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user prompt:', error)
    return null
  }

  return data
}

export async function updateUserPrompt(id: string, updates: Partial<UserPrompt>): Promise<UserPrompt | null> {
  const { data, error } = await supabase
    .from('user_prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user prompt:', error)
    return null
  }

  return data
}

export async function deleteUserPrompt(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_prompts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting user prompt:', error)
    return false
  }

  return true
}

export async function getUserPromptById(id: string): Promise<UserPrompt | null> {
  const { data, error } = await supabase
    .from('user_prompts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching user prompt:', error)
    return null
  }

  return data
} 