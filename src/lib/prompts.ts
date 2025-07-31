import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Server-side data fetching (for pages/server components)
export async function getAllPrompts() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching prompts:', error)
    return []
  }
  
  // Transform database format to match our Prompt interface
  return (prompts || []).map(prompt => ({
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    style: prompt.style,
    camera: prompt.camera,
    lighting: prompt.lighting,
    environment: prompt.environment,
    elements: prompt.elements || [],
    motion: prompt.motion,
    ending: prompt.ending,
    text: prompt.text || 'none',
    keywords: prompt.keywords || [],
    category: prompt.category,
    is_featured: prompt.is_featured || false,
    is_public: prompt.is_public !== false,
    likes_count: prompt.likes_count || 0,
    usage_count: prompt.usage_count || 0,
    created_at: prompt.created_at,
    updated_at: prompt.updated_at,
    created_by: prompt.created_by || ''
  }))
}

export async function getFeaturedPrompts() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('is_public', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6)
  
  if (error) {
    console.error('Error fetching featured prompts:', error)
    return []
  }
  
  // Transform database format to match our Prompt interface
  return (prompts || []).map(prompt => ({
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    style: prompt.style,
    camera: prompt.camera,
    lighting: prompt.lighting,
    environment: prompt.environment,
    elements: prompt.elements || [],
    motion: prompt.motion,
    ending: prompt.ending,
    text: prompt.text || 'none',
    keywords: prompt.keywords || [],
    category: prompt.category,
    is_featured: prompt.is_featured || false,
    is_public: prompt.is_public !== false,
    likes_count: prompt.likes_count || 0,
    usage_count: prompt.usage_count || 0,
    created_at: prompt.created_at,
    updated_at: prompt.updated_at,
    created_by: prompt.created_by || ''
  }))
}

export async function getPromptById(id: string) {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single()
  
  if (error) {
    console.error('Error fetching prompt:', error)
    return null
  }
  
  if (!prompt) return null
  
  // Transform database format to match our Prompt interface
  return {
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    style: prompt.style,
    camera: prompt.camera,
    lighting: prompt.lighting,
    environment: prompt.environment,
    elements: prompt.elements || [],
    motion: prompt.motion,
    ending: prompt.ending,
    text: prompt.text || 'none',
    keywords: prompt.keywords || [],
    timeline: prompt.timeline || null,  // Added timeline field
    category: prompt.category,
    is_featured: prompt.is_featured || false,
    is_public: prompt.is_public !== false,
    likes_count: prompt.likes_count || 0,
    usage_count: prompt.usage_count || 0,
    created_at: prompt.created_at,
    updated_at: prompt.updated_at,
    created_by: prompt.created_by || ''
  }
}

export async function getPromptOfTheDay() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Get featured prompts first, or fallback to most recent
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('is_public', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error || !prompts || prompts.length === 0) {
    // Fallback to any public prompt
    const { data: fallbackPrompts } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(1)
    
    return fallbackPrompts?.[0] || null
  }
  
  return prompts[0]
}

// Client-side data fetching (for client components)
export async function getAllPromptsClient() {
  const supabase = createClientComponentClient<Database>()
  
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching prompts:', error)
    return []
  }
  
  // Transform database format to match our Prompt interface
  return (prompts || []).map(prompt => ({
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    style: prompt.style,
    camera: prompt.camera,
    lighting: prompt.lighting,
    environment: prompt.environment,
    elements: prompt.elements || [],
    motion: prompt.motion,
    ending: prompt.ending,
    text: prompt.text || 'none',
    keywords: prompt.keywords || [],
    category: prompt.category,
    is_featured: prompt.is_featured || false,
    is_public: prompt.is_public !== false,
    likes_count: prompt.likes_count || 0,
    usage_count: prompt.usage_count || 0,
    created_at: prompt.created_at,
    updated_at: prompt.updated_at,
    created_by: prompt.created_by || ''
  }))
}

export async function searchPrompts(query: string, category?: string, style?: string) {
  const supabase = createClientComponentClient<Database>()
  
  let queryBuilder = supabase
    .from('prompts')
    .select('*')
    .eq('is_public', true)
  
  // Add search functionality
  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,keywords.cs.{${query}}`)
  }
  
  // Add category filter
  if (category && category !== 'all') {
    queryBuilder = queryBuilder.eq('category', category)
  }
  
  // Add style filter
  if (style && style !== 'all') {
    queryBuilder = queryBuilder.eq('style', style)
  }
  
  const { data: prompts, error } = await queryBuilder
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error searching prompts:', error)
    return []
  }
  
  return prompts || []
}

// Data ingestion helper - for importing your real data
export async function insertPrompt(promptData: {
  title: string
  description: string
  style: string
  camera: string
  lighting: string
  environment: string
  elements: string[]
  motion: string
  ending: string
  text?: string
  keywords: string[]
  category: string
  is_featured?: boolean
  is_public?: boolean
}) {
  const supabase = createClientComponentClient<Database>()
  
  const { data, error } = await supabase
    .from('prompts')
    .insert([{
      ...promptData,
      text: promptData.text || 'none',
      is_featured: promptData.is_featured || false,
      is_public: promptData.is_public || true,
    }])
    .select()
  
  if (error) {
    console.error('Error inserting prompt:', error)
    throw error
  }
  
  return data?.[0]
}

// Constants (moved from dummy data)
export const categories = [
  'Cinematic',
  'Nature',
  'Urban',
  'Abstract',
  'Portrait',
  'Action',
  'Fantasy',
  'Sci-Fi'
]

export const styles = [
  'Cinematic',
  'Documentary',
  'Artistic',
  'Commercial',
  'Experimental',
  'Vintage',
  'Modern',
  'Dramatic'
] 