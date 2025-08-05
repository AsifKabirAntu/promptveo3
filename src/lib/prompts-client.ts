'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { Prompt } from '@/types/prompt'
import { getUserSubscriptionClient, hasProAccess as checkProSubscription } from '@/lib/subscriptions'

const supabase = createClientComponentClient<Database>()

// Cache settings
const CACHE_TTL = 0; // Set to 0 to disable cache

// Free users can view details for these specific prompt IDs (2 regular prompts)
export const FREE_VIEWABLE_REGULAR_PROMPTS = [
  '719899d1-6bb3-4ddb-ab75-7a25f9442f82', // Hidden Vista Dark
  '4654dffd-4a04-4bbd-8713-98a04a4ee57f', // Radiant Symphony Vacant
];

// Fallback data for when API is unavailable
export const fallbackCategories = [
  "Lifestyle", "Sci-Fi", "Nature", "Creative", "Technology", "Action", "Drama"
];

export const fallbackStyles = [
  "cinematic, vibrant, energetic", "cyberpunk, noir, atmospheric", "epic, majestic, inspirational",
  "sophisticated, elegant, contemporary", "raw, authentic, documentary", "surreal, artistic, experimental"
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

// Helper function to check if a regular prompt can be viewed by free users
export function canViewRegularPrompt(promptId: string): boolean {
  return FREE_VIEWABLE_REGULAR_PROMPTS.includes(promptId);
}

export async function getAllPromptsClient(): Promise<Prompt[]> {
  try {
    // Use direct REST API call - bypassing cache completely
    const data = await fetchDirectFromSupabase<any[]>(
      'prompts?select=*&is_public=eq.true&order=created_at.desc'
    );
    
    // NO LONGER LIMIT DATA - show all prompts to free users
    return data as Prompt[];
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }
}

export async function getUniqueCategories(): Promise<string[]> {
  try {
    const data = await fetchDirectFromSupabase<{category: string}[]>(
      'prompts?select=category&is_public=eq.true'
    );
    
    const categories = [...new Set(data.map(item => item.category))].sort();
    return categories.length > 0 ? categories : fallbackCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return fallbackCategories;
  }
}

export async function getUniqueStyles(): Promise<string[]> {
  try {
    const data = await fetchDirectFromSupabase<{style: string}[]>(
      'prompts?select=style&is_public=eq.true'
    );
    
    const styles = [...new Set(data.map(item => item.style))].sort();
    return styles.length > 0 ? styles : fallbackStyles;
  } catch (error) {
    console.error('Error fetching styles:', error);
    return fallbackStyles;
  }
}

export async function searchPrompts(query: string): Promise<Prompt[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const data = await fetchDirectFromSupabase<any[]>(
      `prompts?select=*&is_public=eq.true&or=(title.ilike.*${encodedQuery}*,description.ilike.*${encodedQuery}*)&order=created_at.desc`
    );
    
    // NO LONGER LIMIT DATA - show all search results to free users
    return data as Prompt[];
  } catch (error) {
    console.error('Error searching prompts:', error);
    return [];
  }
} 