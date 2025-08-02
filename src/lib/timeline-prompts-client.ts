import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { TimelinePrompt } from '@/types/timeline-prompt'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(fetchFn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
  try {
    return await fetchFn()
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`)
      await wait(RETRY_DELAY)
      return fetchWithRetry(fetchFn, retries - 1)
    }
    throw error
  }
}

export async function getAllTimelinePromptsClient(): Promise<TimelinePrompt[]> {
  try {
    console.log('Initializing Supabase client for timeline prompts...')
    const supabase = createClientComponentClient<Database>()

    console.log('Fetching timeline prompts from Supabase...')
    const fetchPrompts = async () => {
      const { data: prompts, error } = await supabase
        .from('timeline_prompts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching timeline prompts:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      if (!prompts) {
        console.warn('No timeline prompts found')
        return []
      }

      console.log(`Successfully fetched ${prompts.length} timeline prompts`)
      return prompts
    }

    return await fetchWithRetry(fetchPrompts)
  } catch (err: any) {
    console.error('Error in getAllTimelinePromptsClient:', err)
    throw new Error(`Failed to fetch timeline prompts: ${err.message}`)
  }
}

export async function searchTimelinePrompts(query: string, category?: string, baseStyle?: string): Promise<TimelinePrompt[]> {
  const supabase = createClientComponentClient<Database>()
  
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
  
  queryBuilder = queryBuilder.order('created_at', { ascending: false })
  
  const { data: prompts, error } = await queryBuilder
  
  if (error) {
    console.error('Error searching timeline prompts:', error)
    return []
  }
  
  // Transform database format to match our TimelinePrompt interface
  return (prompts || []).map(prompt => ({
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
}

export async function getTimelinePromptById(id: string): Promise<TimelinePrompt | null> {
  const supabase = createClientComponentClient<Database>()
  
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
}

export async function getUniqueTimelineCategories(): Promise<string[]> {
  const supabase = createClientComponentClient<Database>()
  
  const { data, error } = await supabase
    .from('timeline_prompts')
    .select('category')
    .eq('is_public', true)
  
  if (error) {
    console.error('Error fetching timeline categories:', error)
    return []
  }
  
  const uniqueCategories = [...new Set(data?.map(item => item.category).filter(Boolean))]
  return uniqueCategories.sort()
}

export async function getUniqueTimelineBaseStyles(): Promise<string[]> {
  const supabase = createClientComponentClient<Database>()
  
  const { data, error } = await supabase
    .from('timeline_prompts')
    .select('base_style')
    .eq('is_public', true)
  
  if (error) {
    console.error('Error fetching timeline base styles:', error)
    return []
  }
  
  const uniqueBaseStyles = [...new Set(data?.map(item => item.base_style).filter(Boolean))]
  return uniqueBaseStyles.sort()
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