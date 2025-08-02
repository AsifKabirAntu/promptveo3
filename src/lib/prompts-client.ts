import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { Prompt } from '@/types/prompt'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(fetchFn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
  try {
    // Add a 10-second timeout for each individual attempt
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Individual fetch timeout (10s)')), 10000)
    })
    
    const result = await Promise.race([fetchFn(), timeoutPromise])
    return result
  } catch (error) {
    console.error('Fetch attempt failed:', error)
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`)
      await wait(RETRY_DELAY)
      return fetchWithRetry(fetchFn, retries - 1)
    }
    throw error
  }
}

export async function getAllPromptsClient(): Promise<Prompt[]> {
  try {
    console.log('Initializing Supabase client...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    const supabase = createClientComponentClient<Database>()

    console.log('Fetching prompts from Supabase...')
    const fetchPrompts = async () => {
      console.log('About to execute Supabase query...')
      const startTime = Date.now()
      
      const { data: prompts, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false })

      const endTime = Date.now()
      console.log(`Supabase query completed in ${endTime - startTime}ms`)

      if (error) {
        console.error('Supabase error fetching prompts:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      if (!prompts) {
        console.warn('No prompts found')
        return []
      }

      console.log(`Successfully fetched ${prompts.length} prompts`)
      return prompts
    }

    return await fetchWithRetry(fetchPrompts)
  } catch (err: any) {
    console.error('Error in getAllPromptsClient:', err)
    throw new Error(`Failed to fetch prompts: ${err.message}`)
  }
}

export async function searchPrompts(query: string, category?: string, style?: string) {
  const supabase = createClientComponentClient<Database>()
  
  let queryBuilder = supabase
    .from('prompts')
    .select('*')
    .eq('is_public', true)
  
  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,keywords.cs.{${query}}`)
  }
  
  if (category) {
    queryBuilder = queryBuilder.eq('category', category)
  }
  
  if (style) {
    queryBuilder = queryBuilder.ilike('style', `%${style}%`)
  }
  
  const { data: prompts, error } = await queryBuilder.order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error searching prompts:', error)
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
    timeline: prompt.timeline || null,  // Added timeline field
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

// Fetch unique categories from database
export async function getUniqueCategories() {
  const supabase = createClientComponentClient<Database>()
  
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('category')
    .eq('is_public', true)
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  
  // Get unique categories and filter out null/empty values
  const uniqueCategories = [...new Set(prompts?.map(p => p.category).filter(Boolean))] as string[]
  return uniqueCategories.sort()
}

// Fetch unique styles from database
export async function getUniqueStyles() {
  const supabase = createClientComponentClient<Database>()
  
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('style')
    .eq('is_public', true)
  
  if (error) {
    console.error('Error fetching styles:', error)
    return []
  }
  
  // Get unique styles and filter out null/empty values
  const uniqueStyles = [...new Set(prompts?.map(p => p.style).filter(Boolean))] as string[]
  return uniqueStyles.sort()
}

// Fallback constants (for when data isn't loaded yet)
export const fallbackCategories = [
  "Cinematic",
  "Action", 
  "Drama",
  "Science Fiction",
  "Horror",
  "Comedy",
  "Documentary",
  "Animation",
  "Experimental"
]

export const fallbackStyles = [
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