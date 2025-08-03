'use client'

import type { Database } from '@/types/database'
import { TimelinePrompt } from '@/types/timeline-prompt'
import { createClient } from './supabase-browser'

// Client-side data fetching for timeline prompts
export async function getAllTimelinePromptsClient(): Promise<TimelinePrompt[]> {
  const supabase = createClient()
  
  try {
    // Add timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000)
    )

    const fetchPromise = supabase
      .from('timeline_prompts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    const { data: prompts, error } = await Promise.race([fetchPromise, timeoutPromise]) as any
  
    if (error) {
      console.error('Error fetching timeline prompts:', error)
      return []
    }
    
    // Transform database format to match our TimelinePrompt interface
    return (prompts || []).map((prompt: Database['public']['Tables']['timeline_prompts']['Row']) => ({
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      category: prompt.category,
      base_style: prompt.base_style,
      aspect_ratio: prompt.aspect_ratio || '16:9',
      scene_description: prompt.scene_description,
      camera_setup: prompt.camera_setup,
      lighting: prompt.lighting,
      negative_prompts: prompt.negative_prompts || [],
      timeline: Array.isArray(prompt.timeline) ? prompt.timeline : [],
      created_by: prompt.created_by || '',
      created_at: prompt.created_at,
      updated_at: prompt.updated_at,
      is_featured: prompt.is_featured || false,
      is_public: prompt.is_public !== false,
      likes_count: prompt.likes_count || 0,
      usage_count: prompt.usage_count || 0
    }))
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      console.error('Timeout fetching timeline prompts:', error)
    } else {
      console.error('Error fetching timeline prompts:', error)
    }
    return []
  }
}

export async function searchTimelinePrompts(query: string, category?: string, baseStyle?: string): Promise<TimelinePrompt[]> {
  const supabase = createClient()
  
  try {
    let queryBuilder = supabase
      .from('timeline_prompts')
      .select('*')
      .eq('is_public', true)
    
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }
    
    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }
    
    if (baseStyle) {
      queryBuilder = queryBuilder.eq('base_style', baseStyle)
    }
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000)
    )

    const { data: prompts, error } = await Promise.race([queryBuilder.order('created_at', { ascending: false }), timeoutPromise]) as any
    
    if (error) {
      console.error('Error searching timeline prompts:', error)
      return []
    }
    
    // Transform database format to match our TimelinePrompt interface
    return (prompts || []).map((prompt: Database['public']['Tables']['timeline_prompts']['Row']) => ({
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      category: prompt.category,
      base_style: prompt.base_style,
      aspect_ratio: prompt.aspect_ratio || '16:9',
      scene_description: prompt.scene_description,
      camera_setup: prompt.camera_setup,
      lighting: prompt.lighting,
      negative_prompts: prompt.negative_prompts || [],
      timeline: Array.isArray(prompt.timeline) ? prompt.timeline : [],
      created_by: prompt.created_by || '',
      created_at: prompt.created_at,
      updated_at: prompt.updated_at,
      is_featured: prompt.is_featured || false,
      is_public: prompt.is_public !== false,
      likes_count: prompt.likes_count || 0,
      usage_count: prompt.usage_count || 0
    }))
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      console.error('Timeout searching timeline prompts:', error)
    } else {
      console.error('Error searching timeline prompts:', error)
    }
    return []
  }
}

export async function getTimelinePromptById(id: string): Promise<TimelinePrompt | null> {
  const supabase = createClient()
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000)
    )

    const fetchPromise = supabase
      .from('timeline_prompts')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single()

    const { data: prompt, error } = await Promise.race([fetchPromise, timeoutPromise]) as any
  
    if (error || !prompt) {
      console.error('Error fetching timeline prompt:', error)
      return null
    }
    
    return {
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      category: prompt.category,
      base_style: prompt.base_style,
      aspect_ratio: prompt.aspect_ratio || '16:9',
      scene_description: prompt.scene_description,
      camera_setup: prompt.camera_setup,
      lighting: prompt.lighting,
      negative_prompts: prompt.negative_prompts || [],
      timeline: Array.isArray(prompt.timeline) ? prompt.timeline : [],
      created_by: prompt.created_by || '',
      created_at: prompt.created_at,
      updated_at: prompt.updated_at,
      is_featured: prompt.is_featured || false,
      is_public: prompt.is_public !== false,
      likes_count: prompt.likes_count || 0,
      usage_count: prompt.usage_count || 0
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      console.error('Timeout fetching timeline prompt:', error)
    } else {
      console.error('Error fetching timeline prompt:', error)
    }
    return null
  }
}

export async function getUniqueTimelineCategories(): Promise<string[]> {
  const supabase = createClient()
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000)
    )

    const fetchPromise = supabase
      .from('timeline_prompts')
      .select('category')
      .eq('is_public', true)

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any
  
    if (error) {
      console.error('Error fetching timeline categories:', error)
      return fallbackTimelineCategories
    }
    
    const uniqueCategories = [...new Set(data?.map((item: Database['public']['Tables']['timeline_prompts']['Row']) => item.category).filter(Boolean))] as string[]
    return uniqueCategories.sort()
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      console.error('Timeout fetching timeline categories:', error)
    } else {
      console.error('Error fetching timeline categories:', error)
    }
    return fallbackTimelineCategories
  }
}

export async function getUniqueTimelineBaseStyles(): Promise<string[]> {
  const supabase = createClient()
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000)
    )

    const fetchPromise = supabase
      .from('timeline_prompts')
      .select('base_style')
      .eq('is_public', true)

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any
  
    if (error) {
      console.error('Error fetching timeline base styles:', error)
      return fallbackTimelineBaseStyles
    }
    
    const uniqueBaseStyles = [...new Set(data?.map((item: Database['public']['Tables']['timeline_prompts']['Row']) => item.base_style).filter(Boolean))] as string[]
    return uniqueBaseStyles.sort()
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      console.error('Timeout fetching timeline base styles:', error)
    } else {
      console.error('Error fetching timeline base styles:', error)
    }
    return fallbackTimelineBaseStyles
  }
}

// Fallback data for when API calls fail
export const fallbackTimelineCategories = [
  "Creative",
  "Cinematic",
  "Nature",
  "Urban",
  "Abstract",
  "Documentary",
  "Animation",
  "Experimental"
]

export const fallbackTimelineBaseStyles = [
  "cinematic",
  "dramatic",
  "atmospheric",
  "vibrant",
  "moody",
  "ethereal",
  "gritty",
  "stylized",
  "realistic",
  "surreal"
] 