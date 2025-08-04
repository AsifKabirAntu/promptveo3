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
const CACHE_TTL = 0; // Set to 0 to disable cache
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
  const previewCount = 3;
  return data.slice(0, previewCount);
}

export async function getAllPromptsClient(): Promise<Prompt[]> {
  try {
    // Use direct REST API call - bypassing cache completely
    const data = await fetchDirectFromSupabase<any[]>(
      'prompts?select=*&is_public=eq.true&order=created_at.desc'
    );
    
    // Return limited data for free users
    return limitDataForFreeUsers(data as Prompt[]);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }
}

export async function getUniqueCategories(): Promise<string[]> {
  try {
    // Use direct REST API call - bypassing cache completely
    const data = await fetchDirectFromSupabase<Array<{category: string}>>(
      'prompts?select=category&is_public=eq.true'
    );
    
    const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))].sort();
    return uniqueCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return fallbackCategories;
  }
}

export async function getUniqueStyles(): Promise<string[]> {
  try {
    // Use direct REST API call - bypassing cache completely
    const data = await fetchDirectFromSupabase<Array<{style: string}>>(
      'prompts?select=style&is_public=eq.true'
    );
    
    const uniqueStyles = [...new Set(data.map(item => item.style).filter(Boolean))].sort();
    return uniqueStyles;
  } catch (error) {
    console.error('Error fetching styles:', error);
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