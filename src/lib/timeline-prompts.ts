import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { TimelinePrompt, TimelineSequence } from '@/types/timeline-prompt'

// Basic interface for timeline prompt database row
interface TimelinePromptRow {
  id: string
  title: string
  description: string
  category: string
  base_style: string
  aspect_ratio: string
  scene_description: string
  camera_setup: string
  lighting: string
  negative_prompts: string[]
  timeline: unknown
  created_by: string
  created_at: string
  updated_at: string
  is_featured: boolean
  is_public: boolean
  likes_count: number
  usage_count: number
}

// Server-side data fetching for timeline prompts (for pages/server components)
export async function getAllTimelinePrompts(): Promise<TimelinePrompt[]> {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: prompts, error } = await supabase
    .from('timeline_prompts')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching timeline prompts:', error)
    return []
  }
  
  // Transform database format to match our TimelinePrompt interface
  return (prompts || []).map((prompt: TimelinePromptRow) => ({
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    category: prompt.category,
    base_style: prompt.base_style,
    aspect_ratio: prompt.aspect_ratio,
    scene_description: prompt.scene_description,
    camera_setup: prompt.camera_setup,
    lighting: prompt.lighting,
    negative_prompts: prompt.negative_prompts || [],
    timeline: prompt.timeline as TimelineSequence[], // JSONB field
    created_by: prompt.created_by || '',
    created_at: prompt.created_at,
    updated_at: prompt.updated_at,
    is_featured: prompt.is_featured,
    is_public: prompt.is_public,
    likes_count: prompt.likes_count,
    usage_count: prompt.usage_count
  }))
}

export async function getTimelinePromptById(id: string): Promise<TimelinePrompt | null> {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: prompt, error } = await supabase
    .from('timeline_prompts')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single()
  
  if (error || !prompt) {
    console.error('Error fetching timeline prompt:', error)
    return null
  }
  
  // Transform database format to match our TimelinePrompt interface
  const timelinePrompt = prompt as TimelinePromptRow
  return {
    id: timelinePrompt.id,
    title: timelinePrompt.title,
    description: timelinePrompt.description,
    category: timelinePrompt.category,
    base_style: timelinePrompt.base_style,
    aspect_ratio: timelinePrompt.aspect_ratio,
    scene_description: timelinePrompt.scene_description,
    camera_setup: timelinePrompt.camera_setup,
    lighting: timelinePrompt.lighting,
    negative_prompts: timelinePrompt.negative_prompts || [],
    timeline: timelinePrompt.timeline as TimelineSequence[], // JSONB field
    created_by: timelinePrompt.created_by || '',
    created_at: timelinePrompt.created_at,
    updated_at: timelinePrompt.updated_at,
    is_featured: timelinePrompt.is_featured,
    is_public: timelinePrompt.is_public,
    likes_count: timelinePrompt.likes_count,
    usage_count: timelinePrompt.usage_count
  }
}

export async function getFeaturedTimelinePrompts(): Promise<TimelinePrompt[]> {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: prompts, error } = await supabase
    .from('timeline_prompts')
    .select('*')
    .eq('is_public', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6)
  
  if (error) {
    console.error('Error fetching featured timeline prompts:', error)
    return []
  }
  
  // Transform database format to match our TimelinePrompt interface
  return (prompts || []).map((prompt: TimelinePromptRow) => ({
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    category: prompt.category,
    base_style: prompt.base_style,
    aspect_ratio: prompt.aspect_ratio,
    scene_description: prompt.scene_description,
    camera_setup: prompt.camera_setup,
    lighting: prompt.lighting,
    negative_prompts: prompt.negative_prompts || [],
    timeline: prompt.timeline as TimelineSequence[], // JSONB field
    created_by: prompt.created_by || '',
    created_at: prompt.created_at,
    updated_at: prompt.updated_at,
    is_featured: prompt.is_featured,
    is_public: prompt.is_public,
    likes_count: prompt.likes_count,
    usage_count: prompt.usage_count
  }))
} 