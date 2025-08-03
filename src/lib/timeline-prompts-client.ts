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
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
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
  console.log(`Fetching from: ${url}`);
  
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
  try {
    // Check if we have subscription info in localStorage
    const subKey = 'subscription_data';
    const storedSub = localStorage.getItem(subKey);
    if (storedSub) {
      const { plan, status } = JSON.parse(storedSub);
      return status === 'active' && plan === 'pro';
    }
    return false;
  } catch (e) {
    return false;
  }
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
    // Check cache first
    if (isCacheValid('timelinePrompts')) {
      console.log('Using cached timeline prompts data');
      return limitDataForFreeUsers(cache.timelinePrompts.data as TimelinePrompt[]);
    }

    console.log('Fetching timeline prompts from Supabase...');
    
    // Try to load from localStorage if available
    try {
      const savedPrompts = localStorage.getItem('timeline_prompts_cache');
      if (savedPrompts) {
        const { data, timestamp } = JSON.parse(savedPrompts) as { data: TimelinePrompt[], timestamp: number };
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('Using localStorage timeline prompts data');
          return limitDataForFreeUsers(data);
        }
      }
    } catch (e) {
      console.log('No valid localStorage cache for timeline prompts');
    }
    
    // Use direct REST API call
    const data = await fetchDirectFromSupabase<Database['public']['Tables']['timeline_prompts']['Row'][]>(
      'timeline_prompts?select=*&is_public=eq.true&order=created_at.desc'
    );
    
    // Update cache with full data
    cache.timelinePrompts = { data: data as unknown as TimelinePrompt[], timestamp: Date.now() };
    
    // Save to localStorage
    try {
      localStorage.setItem('timeline_prompts_cache', JSON.stringify({ 
        data, 
        timestamp: Date.now() 
      }));
    } catch (e) {
      console.error('Error saving timeline prompts to localStorage:', e);
    }
    
    // Return limited data for free users
    return limitDataForFreeUsers(data as unknown as TimelinePrompt[]);
  } catch (error) {
    console.error('Error fetching timeline prompts:', error);
    
    // Try to load from localStorage as fallback
    try {
      const savedPrompts = localStorage.getItem('timeline_prompts_cache');
      if (savedPrompts) {
        const { data } = JSON.parse(savedPrompts) as { data: TimelinePrompt[] };
        console.log('Using localStorage fallback for timeline prompts');
        return limitDataForFreeUsers(data);
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    
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
    // Check cache first
    if (isIdCacheValid(id)) {
      console.log(`Using cached timeline prompt data for id: ${id}`);
      return cache.timelinePromptsById[id].data as TimelinePrompt;
    }

    console.log(`Fetching timeline prompt with id: ${id} from Supabase...`);
    
    // Try to load from localStorage if available
    try {
      const savedPrompt = localStorage.getItem(`cached_timeline_prompt_${id}`);
      if (savedPrompt) {
        const { data, timestamp } = JSON.parse(savedPrompt) as { data: TimelinePrompt | null, timestamp: number };
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log(`Using localStorage data for timeline prompt id: ${id}`);
          return data;
        }
      }
    } catch (e) {
      console.log(`No valid localStorage cache for timeline prompt id: ${id}`);
    }
    
    // Use direct REST API call
    const prompts = await fetchDirectFromSupabase<Database['public']['Tables']['timeline_prompts']['Row'][]>(
      `timeline_prompts?id=eq.${id}&is_public=eq.true`
    );
    
    if (!prompts || prompts.length === 0) {
      console.error('Timeline prompt not found');
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

    // Update cache
    if (!cache.timelinePromptsById[id]) {
      cache.timelinePromptsById[id] = { data: null, timestamp: 0 };
    }
    cache.timelinePromptsById[id] = { data: transformedPrompt, timestamp: Date.now() };
    
    // Save to localStorage
    try {
      localStorage.setItem(`cached_timeline_prompt_${id}`, JSON.stringify({ 
        data: transformedPrompt, 
        timestamp: Date.now() 
      }));
    } catch (e) {
      console.error(`Failed to save timeline prompt ${id} to localStorage`, e);
    }

    return transformedPrompt;
  } catch (error) {
    console.error('Error fetching timeline prompt:', error);
    
    // Try to load from localStorage as fallback
    try {
      const savedPrompt = localStorage.getItem(`cached_timeline_prompt_${id}`);
      if (savedPrompt) {
        console.log(`Using localStorage as fallback for timeline prompt id: ${id}`);
        return JSON.parse(savedPrompt).data;
      }
    } catch (e) {
      console.log('No fallback data available');
    }
    
    return null;
  }
}

export async function getUniqueTimelineCategories(): Promise<string[]> {
  try {
    // Check cache first
    if (isCacheValid('timelineCategories')) {
      console.log('Using cached timeline categories data');
      return cache.timelineCategories.data as string[];
    }

    console.log('Fetching timeline categories from Supabase...');
    
    // Try to load from localStorage if available
    try {
      const savedCategories = localStorage.getItem('cached_timeline_categories');
      if (savedCategories) {
        const { data, timestamp } = JSON.parse(savedCategories) as { data: string[], timestamp: number };
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('Using localStorage timeline categories data');
          return data;
        }
      }
    } catch (e) {
      console.log('No valid localStorage cache for timeline categories');
    }
    
    // Use direct REST API call
    const data = await fetchDirectFromSupabase<Array<{category: string}>>(
      'timeline_prompts?select=category&is_public=eq.true'
    );
    
    const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))].sort();
    
    // Update cache
    cache.timelineCategories = { data: uniqueCategories, timestamp: Date.now() };
    
    // Save to localStorage
    try {
      localStorage.setItem('cached_timeline_categories', JSON.stringify({ 
        data: uniqueCategories, 
        timestamp: Date.now() 
      }));
    } catch (e) {
      console.error('Failed to save timeline categories to localStorage', e);
    }

    return uniqueCategories;
  } catch (error) {
    console.error('Error fetching timeline categories:', error);
    
    // Try to load from localStorage as fallback
    try {
      const savedCategories = localStorage.getItem('cached_timeline_categories');
      if (savedCategories) {
        console.log('Using localStorage timeline categories as fallback');
        return JSON.parse(savedCategories).data;
      }
    } catch (e) {
      console.log('No fallback data available');
    }
    
    return fallbackTimelineCategories;
  }
}

export async function getUniqueTimelineBaseStyles(): Promise<string[]> {
  try {
    // Check cache first
    if (isCacheValid('timelineStyles')) {
      console.log('Using cached timeline styles data');
      return cache.timelineStyles.data as string[];
    }

    console.log('Fetching timeline styles from Supabase...');
    
    // Try to load from localStorage if available
    try {
      const savedStyles = localStorage.getItem('cached_timeline_styles');
      if (savedStyles) {
        const { data, timestamp } = JSON.parse(savedStyles) as { data: string[], timestamp: number };
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('Using localStorage timeline styles data');
          return data;
        }
      }
    } catch (e) {
      console.log('No valid localStorage cache for timeline styles');
    }
    
    // Use direct REST API call
    const data = await fetchDirectFromSupabase<Array<{base_style: string}>>(
      'timeline_prompts?select=base_style&is_public=eq.true'
    );
    
    const uniqueStyles = [...new Set(data.map(item => item.base_style).filter(Boolean))].sort();
    
    // Update cache
    cache.timelineStyles = { data: uniqueStyles, timestamp: Date.now() };
    
    // Save to localStorage
    try {
      localStorage.setItem('cached_timeline_styles', JSON.stringify({ 
        data: uniqueStyles, 
        timestamp: Date.now() 
      }));
    } catch (e) {
      console.error('Failed to save timeline styles to localStorage', e);
    }

    return uniqueStyles;
  } catch (error) {
    console.error('Error fetching timeline base styles:', error);
    
    // Try to load from localStorage as fallback
    try {
      const savedStyles = localStorage.getItem('cached_timeline_styles');
      if (savedStyles) {
        console.log('Using localStorage timeline styles as fallback');
        return JSON.parse(savedStyles).data;
      }
    } catch (e) {
      console.log('No fallback data available');
    }
    
    return fallbackTimelineBaseStyles;
  }
} 