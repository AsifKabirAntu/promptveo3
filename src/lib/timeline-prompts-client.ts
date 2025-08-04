'use client'

import type { Database } from '@/types/database'
import { TimelinePrompt } from '@/types/timeline-prompt'
import { createClient } from './supabase-browser'

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

// Cache types
type CacheData<T> = {
  data: T | null;
  timestamp: number;
}

type CacheStore = {
  timelinePrompts: CacheData<TimelinePrompt[]>;
  timelineCategories: CacheData<string[]>;
  timelineStyles: CacheData<string[]>;
  timelinePromptsById: Record<string, CacheData<TimelinePrompt | null>>;
}

// Cache storage
const CACHE_TTL = 0; // Set to 0 to disable cache
const cache: CacheStore = {
  timelinePrompts: { data: null, timestamp: 0 },
  timelineCategories: { data: null, timestamp: 0 },
  timelineStyles: { data: null, timestamp: 0 },
  timelinePromptsById: {}
};

// Helper to check if cache is valid
function isCacheValid(cacheKey: keyof Omit<CacheStore, 'timelinePromptsById'>): boolean {
  return cache[cacheKey].data !== null && 
         (Date.now() - cache[cacheKey].timestamp) < CACHE_TTL;
}

function isIdCacheValid(id: string): boolean {
  return cache.timelinePromptsById[id]?.data !== null && 
         (Date.now() - (cache.timelinePromptsById[id]?.timestamp || 0)) < CACHE_TTL;
}

// Helper for direct API fetching with timeout
async function fetchDirectFromSupabase<T>(endpoint: string, options = {}): Promise<T> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), 10000);
  });
  
  const fetchPromise = fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      ...options
    }
  }).then(async response => {
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return response.json();
  });
  
  return Promise.race([fetchPromise, timeoutPromise]);
}

// Helper to check if user has pro access
function hasProAccess(): boolean {
  // Pro access check should rely on prop passed from parent component
  // For now, we'll default to true to show all data
  return true;
}

// Helper to limit data for free users
function limitDataForFreeUsers<T>(data: T[]): T[] {
  if (hasProAccess()) {
    return data; // Pro users get all data
  }
  
  // Free users get limited data
  const previewCount = 1; // Free users get only 1 timeline prompt
  return data.slice(0, previewCount);
}

// Client-side data fetching for timeline prompts
export async function getAllTimelinePromptsClient(): Promise<TimelinePrompt[]> {
  try {
    // Use direct REST API call - bypassing cache completely
    const data = await fetchDirectFromSupabase<Database['public']['Tables']['timeline_prompts']['Row'][]>(
      'timeline_prompts?select=*&is_public=eq.true&order=created_at.desc'
    );
    
    // Don't update cache, don't save to localStorage
    
    // Return limited data for free users
    return limitDataForFreeUsers(data as unknown as TimelinePrompt[]);
  } catch (error) {
    console.error('Error fetching timeline prompts:', error);
    return [];
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
  try {
    // Use direct REST API call - bypassing cache completely
    const prompts = await fetchDirectFromSupabase<Database['public']['Tables']['timeline_prompts']['Row'][]>(
      `timeline_prompts?id=eq.${id}&is_public=eq.true`
    );
    
    if (!prompts || prompts.length === 0) {
      return null;
    }
    
    const prompt = prompts[0];
    
    const transformedPrompt = {
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
    };

    return transformedPrompt;
  } catch (error) {
    console.error('Error fetching timeline prompt:', error);
    return null;
  }
}

export async function getUniqueTimelineCategories(): Promise<string[]> {
  try {
    // Use direct REST API call - bypassing cache completely
    const data = await fetchDirectFromSupabase<Array<{category: string}>>(
      'timeline_prompts?select=category&is_public=eq.true'
    );
    
    const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))].sort();
    return uniqueCategories;
  } catch (error) {
    console.error('Error fetching timeline categories:', error);
    return fallbackTimelineCategories;
  }
}

export async function getUniqueTimelineBaseStyles(): Promise<string[]> {
  try {
    // Use direct REST API call - bypassing cache completely
    const data = await fetchDirectFromSupabase<Array<{base_style: string}>>(
      'timeline_prompts?select=base_style&is_public=eq.true'
    );
    
    const uniqueStyles = [...new Set(data.map(item => item.base_style).filter(Boolean))].sort();
    return uniqueStyles;
  } catch (error) {
    console.error('Error fetching timeline base styles:', error);
    return fallbackTimelineBaseStyles;
  }
} 