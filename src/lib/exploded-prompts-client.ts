'use client'

import { ExplodedBuildPrompt } from '@/types/exploded-prompt'
import { Database } from '@/types/database'
import { getUserSubscriptionClient, hasProAccess as checkProSubscription } from '@/lib/subscriptions'

const CACHE_TTL = 0

export const FREE_VIEWABLE_EXPLODED_PROMPTS: string[] = []

export async function hasProAccess(): Promise<boolean> {
  try {
    const subscription = await getUserSubscriptionClient()
    return checkProSubscription(subscription)
  } catch (error) {
    console.error('Error checking pro access:', error)
    return false
  }
}

export function canViewExplodedPrompt(promptId: string): boolean {
  return FREE_VIEWABLE_EXPLODED_PROMPTS.includes(promptId)
}

async function fetchDirectFromSupabase<T>(endpoint: string, options = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!baseUrl || !apiKey) throw new Error('Supabase configuration missing')
  const url = `${baseUrl}/rest/v1/${endpoint}`
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000))
  const fetchPromise = fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options,
    },
  })
  const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return (await response.json()) as T
}

export async function getAllExplodedPromptsClient(): Promise<ExplodedBuildPrompt[]> {
  try {
    const data = await fetchDirectFromSupabase<Database['public']['Tables']['exploded_build_prompts']['Row'][]>(
      'exploded_build_prompts?select=*&is_public=eq.true&order=created_at.desc'
    )

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category || 'Exploded Build',
      shot: (row.shot || {}) as any,
      subject: (row.subject || {}) as any,
      scene: (row.scene || {}) as any,
      visual_details: (row.visual_details || {}) as any,
      cinematography: (row.cinematography || {}) as any,
      audio: (row.audio || {}) as any,
      dialogue: (row.dialogue || {}) as any,
      created_by: row.created_by || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_featured: row.is_featured || false,
      is_public: row.is_public !== false,
      likes_count: row.likes_count || 0,
      usage_count: row.usage_count || 0,
    })) as ExplodedBuildPrompt[]
  } catch (error) {
    console.error('Error fetching exploded build prompts:', error)
    return []
  }
}

export async function getExplodedPromptById(id: string): Promise<ExplodedBuildPrompt | null> {
  try {
    const data = await fetchDirectFromSupabase<Database['public']['Tables']['exploded_build_prompts']['Row'][]>(
      `exploded_build_prompts?select=*&id=eq.${id}&is_public=eq.true&limit=1`
    )
    if (!data || data.length === 0) return null
    const row = data[0]
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category || 'Exploded Build',
      shot: (row.shot || {}) as any,
      subject: (row.subject || {}) as any,
      scene: (row.scene || {}) as any,
      visual_details: (row.visual_details || {}) as any,
      cinematography: (row.cinematography || {}) as any,
      audio: (row.audio || {}) as any,
      dialogue: (row.dialogue || {}) as any,
      created_by: row.created_by || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_featured: row.is_featured || false,
      is_public: row.is_public !== false,
      likes_count: row.likes_count || 0,
      usage_count: row.usage_count || 0,
    } as ExplodedBuildPrompt
  } catch (error) {
    console.error('Error fetching exploded build prompt by ID:', error)
    return null
  }
} 