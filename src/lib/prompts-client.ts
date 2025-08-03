'use client'

import { Prompt } from '@/types/prompt'
import { createClient } from './supabase-browser'

// Fallback data if API fails
export const fallbackCategories = ['Business', 'Creative', 'Education', 'Entertainment', 'Technical']
export const fallbackStyles = ['Action', 'Drama', 'Comedy', 'Horror']

// Cache types
type CacheData<T> = {
  data: T | null;
  timestamp: number;
}

type CacheStore = {
  prompts: CacheData<Prompt[]>;
  categories: CacheData<string[]>;
  styles: CacheData<string[]>;
}

// Cache storage
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache: CacheStore = {
  prompts: { data: null, timestamp: 0 },
  categories: { data: null, timestamp: 0 },
  styles: { data: null, timestamp: 0 }
};

// Helper to check if cache is valid
function isCacheValid(cacheKey: keyof CacheStore): boolean {
  return cache[cacheKey].data !== null && 
         (Date.now() - cache[cacheKey].timestamp) < CACHE_TTL;
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
  }).then(response => {
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  });
  
  return Promise.race([fetchPromise, timeoutPromise]);
}

export async function getAllPromptsClient(): Promise<Prompt[]> {
  try {
    // Check cache first
    if (isCacheValid('prompts')) {
      console.log('Using cached prompts data');
      return cache.prompts.data as Prompt[];
    }

    console.log('Fetching prompts from Supabase...');
    
    // Try to load from localStorage if available
    try {
      const savedPrompts = localStorage.getItem('cached_prompts');
      if (savedPrompts) {
        const { data, timestamp } = JSON.parse(savedPrompts) as { data: Prompt[], timestamp: number };
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('Using localStorage prompts data');
          return data;
        }
      }
    } catch (e) {
      console.log('No valid localStorage cache for prompts');
    }
    
    // Use direct REST API call instead of Supabase client
    const data = await fetchDirectFromSupabase<Prompt[]>('prompts?select=*&order=created_at.desc');
    
    // Update cache
    cache.prompts = { data, timestamp: Date.now() };
    
    // Save to localStorage
    try {
      localStorage.setItem('cached_prompts', JSON.stringify({ 
        data, 
        timestamp: Date.now() 
      }));
    } catch (e) {
      console.error('Failed to save prompts to localStorage', e);
    }

    return data;
  } catch (error) {
    console.error('Error fetching prompts:', error);
    
    // Try to load from localStorage as fallback
    try {
      const savedPrompts = localStorage.getItem('cached_prompts');
      if (savedPrompts) {
        console.log('Using localStorage prompts as fallback');
        return JSON.parse(savedPrompts).data;
      }
    } catch (e) {
      console.log('No fallback data available');
    }
    
    return [];
  }
}

export async function getUniqueCategories(): Promise<string[]> {
  try {
    // Check cache first
    if (isCacheValid('categories')) {
      console.log('Using cached categories data');
      return cache.categories.data as string[];
    }

    console.log('Fetching categories from Supabase...');
    
    // Try to load from localStorage if available
    try {
      const savedCategories = localStorage.getItem('cached_categories');
      if (savedCategories) {
        const { data, timestamp } = JSON.parse(savedCategories) as { data: string[], timestamp: number };
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('Using localStorage categories data');
          return data;
        }
      }
    } catch (e) {
      console.log('No valid localStorage cache for categories');
    }
    
    // Use direct REST API call
    const data = await fetchDirectFromSupabase<Array<{category: string}>>('prompts?select=category');
    
    const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))].sort();
    
    // Update cache
    cache.categories = { data: uniqueCategories, timestamp: Date.now() };
    
    // Save to localStorage
    try {
      localStorage.setItem('cached_categories', JSON.stringify({ 
        data: uniqueCategories, 
        timestamp: Date.now() 
      }));
    } catch (e) {
      console.error('Failed to save categories to localStorage', e);
    }

    return uniqueCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    // Try to load from localStorage as fallback
    try {
      const savedCategories = localStorage.getItem('cached_categories');
      if (savedCategories) {
        console.log('Using localStorage categories as fallback');
        return JSON.parse(savedCategories).data;
      }
    } catch (e) {
      console.log('No fallback data available');
    }
    
    return fallbackCategories;
  }
}

export async function getUniqueStyles(): Promise<string[]> {
  try {
    // Check cache first
    if (isCacheValid('styles')) {
      console.log('Using cached styles data');
      return cache.styles.data as string[];
    }

    console.log('Fetching styles from Supabase...');
    
    // Try to load from localStorage if available
    try {
      const savedStyles = localStorage.getItem('cached_styles');
      if (savedStyles) {
        const { data, timestamp } = JSON.parse(savedStyles) as { data: string[], timestamp: number };
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('Using localStorage styles data');
          return data;
        }
      }
    } catch (e) {
      console.log('No valid localStorage cache for styles');
    }
    
    // Use direct REST API call
    const data = await fetchDirectFromSupabase<Array<{style: string}>>('prompts?select=style');
    
    const uniqueStyles = [...new Set(data.map(item => item.style).filter(Boolean))].sort();
    
    // Update cache
    cache.styles = { data: uniqueStyles, timestamp: Date.now() };
    
    // Save to localStorage
    try {
      localStorage.setItem('cached_styles', JSON.stringify({ 
        data: uniqueStyles, 
        timestamp: Date.now() 
      }));
    } catch (e) {
      console.error('Failed to save styles to localStorage', e);
    }

    return uniqueStyles;
  } catch (error) {
    console.error('Error fetching styles:', error);
    
    // Try to load from localStorage as fallback
    try {
      const savedStyles = localStorage.getItem('cached_styles');
      if (savedStyles) {
        console.log('Using localStorage styles as fallback');
        return JSON.parse(savedStyles).data;
      }
    } catch (e) {
      console.log('No fallback data available');
    }
    
    return fallbackStyles;
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