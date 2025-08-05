'use client'

import { TimelinePrompt } from '@/types/timeline-prompt'
import { Database } from '@/types/database'
import { getUserSubscriptionClient, hasProAccess as checkProSubscription } from '@/lib/subscriptions'

// Cache settings
const CACHE_TTL = 0; // Set to 0 to disable cache

// Free users can view details for these specific timeline prompt IDs (2 timeline prompts)
export const FREE_VIEWABLE_TIMELINE_PROMPTS = [
  '28555444-213c-4377-8688-070d530241dd', // Rescue Response
  'b023a9f9-2ffb-4931-af54-881c86eec25f', // Assembly Line Symphony
];

// Fallback data for when API is unavailable
export const fallbackTimelineCategories = [
  "Creative", "AI Robotics", "Lifestyle", "Technology", "Action", "Drama"
];

export const fallbackTimelineBaseStyles = [
  "cinematic", "4K", "dreamlike fantasy look", "animated realism", "photorealistic"
];

// Helper for direct API fetching with timeout
async function fetchDirectFromSupabase<T>(endpoint: string, options = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!baseUrl || !apiKey) {
    throw new Error('Supabase configuration missing');
  }

  const url = `${baseUrl}/rest/v1/${endpoint}`;
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000)
  );

  const fetchPromise = fetch(url, {
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options
    }
  });

  try {
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Direct Supabase fetch error:', error);
    throw error;
  }
}

// Helper to check if user has pro access
export async function hasProAccess(): Promise<boolean> {
  try {
    // Get the user's subscription
    const subscription = await getUserSubscriptionClient();
    
    // Check if they have pro access
    return checkProSubscription(subscription);
  } catch (error) {
    console.error('Error checking pro access:', error);
    return false; // Default to no pro access on error
  }
}

// Helper function to check if a timeline prompt can be viewed by free users
export function canViewTimelinePrompt(promptId: string): boolean {
  return FREE_VIEWABLE_TIMELINE_PROMPTS.includes(promptId);
}

// Client-side data fetching for timeline prompts
export async function getAllTimelinePromptsClient(): Promise<TimelinePrompt[]> {
  try {
    // Use direct REST API call - bypassing cache completely
    const data = await fetchDirectFromSupabase<Database['public']['Tables']['timeline_prompts']['Row'][]>(
      'timeline_prompts?select=*&is_public=eq.true&order=created_at.desc'
    );
    
    // Transform database format to match our TimelinePrompt interface
    const timelinePrompts = (data || []).map((prompt: Database['public']['Tables']['timeline_prompts']['Row']) => ({
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
    }));
    
    // NO LONGER LIMIT DATA - show all timeline prompts to free users
    return timelinePrompts as TimelinePrompt[];
  } catch (error) {
    console.error('Error fetching timeline prompts:', error);
    return [];
  }
}

export async function searchTimelinePrompts(query: string, category?: string, baseStyle?: string): Promise<TimelinePrompt[]> {
  try {
    // Build query parameters
    let queryParams = 'select=*&is_public=eq.true';
    
    // Add search conditions
    const conditions: string[] = [];
    if (query) {
      conditions.push(`title.ilike.*${encodeURIComponent(query)}*`);
      conditions.push(`description.ilike.*${encodeURIComponent(query)}*`);
    }
    
    if (conditions.length > 0) {
      queryParams += `&or=(${conditions.join(',')})`;
    }
    
    if (category) {
      queryParams += `&category=eq.${encodeURIComponent(category)}`;
    }
    
    if (baseStyle) {
      queryParams += `&base_style=eq.${encodeURIComponent(baseStyle)}`;
    }
    
    queryParams += '&order=created_at.desc';
    
    const data = await fetchDirectFromSupabase<Database['public']['Tables']['timeline_prompts']['Row'][]>(
      `timeline_prompts?${queryParams}`
    );
    
    // Transform database format to match our TimelinePrompt interface
    const timelinePrompts = (data || []).map((prompt: Database['public']['Tables']['timeline_prompts']['Row']) => ({
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
    }));
    
    // NO LONGER LIMIT DATA - show all search results to free users
    return timelinePrompts as TimelinePrompt[];
  } catch (error) {
    console.error('Error searching timeline prompts:', error);
    return [];
  }
}

export async function getTimelinePromptById(id: string): Promise<TimelinePrompt | null> {
  try {
    const data = await fetchDirectFromSupabase<Database['public']['Tables']['timeline_prompts']['Row'][]>(
      `timeline_prompts?select=*&id=eq.${id}&is_public=eq.true&limit=1`
    );
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const prompt = data[0];
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
    } as TimelinePrompt;
  } catch (error) {
    console.error('Error fetching timeline prompt by ID:', error);
    return null;
  }
}

export async function getUniqueTimelineCategories(): Promise<string[]> {
  try {
    const data = await fetchDirectFromSupabase<{category: string}[]>(
      'timeline_prompts?select=category&is_public=eq.true'
    );
    
    const categories = [...new Set(data.map(item => item.category))].sort();
    return categories.length > 0 ? categories : fallbackTimelineCategories;
  } catch (error) {
    console.error('Error fetching timeline categories:', error);
    return fallbackTimelineCategories;
  }
}

export async function getUniqueTimelineBaseStyles(): Promise<string[]> {
  try {
    const data = await fetchDirectFromSupabase<{base_style: string}[]>(
      'timeline_prompts?select=base_style&is_public=eq.true'
    );
    
    const styles = [...new Set(data.map(item => item.base_style))].sort();
    return styles.length > 0 ? styles : fallbackTimelineBaseStyles;
  } catch (error) {
    console.error('Error fetching timeline base styles:', error);
    return fallbackTimelineBaseStyles;
  }
} 