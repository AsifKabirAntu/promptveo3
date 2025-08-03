'use client'

import { createClient } from './supabase-browser'
import { Prompt } from '@/types/prompt'

// Fallback data
export const fallbackCategories = ['Cinematic', 'Commercial', 'Documentary', 'Music Video']
export const fallbackStyles = ['Action', 'Drama', 'Comedy', 'Horror']

export async function getAllPromptsClient(): Promise<Prompt[]> {
  const supabase = createClient()
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 15000)
    )

    const fetchPromise = supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return []
  }
}

export async function getUniqueCategories(): Promise<string[]> {
  const supabase = createClient()
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 15000)
    )

    const fetchPromise = supabase
      .from('prompts')
      .select('category')
      .not('category', 'is', null)

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

    if (error) throw error
    
    const categories = [...new Set((data as { category: string }[])?.map(p => p.category))]
    return categories.length > 0 ? categories.sort() : fallbackCategories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return fallbackCategories
  }
}

export async function getUniqueStyles(): Promise<string[]> {
  const supabase = createClient()
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 15000)
    )

    const fetchPromise = supabase
      .from('prompts')
      .select('style')
      .not('style', 'is', null)

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

    if (error) throw error
    
    const styles = [...new Set((data as { style: string }[])?.map(p => p.style))]
    return styles.length > 0 ? styles.sort() : fallbackStyles
  } catch (error) {
    console.error('Error fetching styles:', error)
    return fallbackStyles
  }
}

export async function searchPrompts(query: string): Promise<Prompt[]> {
  const supabase = createClient()
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 15000)
    )

    const fetchPromise = supabase
      .from('prompts')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching prompts:', error)
    return []
  }
} 