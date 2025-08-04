'use client';

/**
 * Clear any existing localStorage cache when the app loads
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Remove all cache-related items
    const cachesToClear = [
      // Regular prompts
      'prompts_cache',
      'cached_categories',
      'cached_styles',
      'prompts_cache_timestamp',
      
      // Timeline prompts
      'timeline_prompts_cache',
      'cached_timeline_categories',
      'cached_timeline_styles',
    ];
    
    cachesToClear.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear any individual cached prompts
    const allKeys = Object.keys(localStorage);
    const promptKeys = allKeys.filter(key => 
      key.startsWith('cached_prompt_') || 
      key.startsWith('cached_timeline_prompt_')
    );
    
    promptKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Auto-execute on import in client components
if (typeof window !== 'undefined') {
  clearCache();
}

export default clearCache; 