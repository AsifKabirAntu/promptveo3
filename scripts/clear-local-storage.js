// Run this script in your browser console when on the dashboard page
// Copy and paste the entire script, then press Enter

(function clearCaches() {
  console.log('🧹 Starting cache cleanup...');

  // Clear timeline prompts cache
  localStorage.removeItem('timeline_prompts_cache');
  localStorage.removeItem('cached_timeline_categories');
  localStorage.removeItem('cached_timeline_styles');
  
  // Clear regular prompts cache too (just to be thorough)
  localStorage.removeItem('prompts_cache');
  localStorage.removeItem('cached_categories');
  localStorage.removeItem('cached_styles');
  
  // Also clear any individual cached prompts
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('cached_timeline_prompt_') || key.startsWith('cached_prompt_')) {
      keysToRemove.push(key);
    }
  }
  
  // Remove the collected keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️  Removed: ${key}`);
  });
  
  // Clear prompts cache timestamp
  localStorage.removeItem('prompts_cache_timestamp');
  
  console.log('✅ Cache cleared successfully!');
  console.log('🔄 Please refresh the page to load fresh data from the database.');
  
  return 'Cache clearing complete. Refresh the page to see the changes.';
})(); 