import { NextResponse } from 'next/server';

export async function GET() {
  // Create a JavaScript that will clear the localStorage
  const clearCacheScript = `
    // Clear timeline prompts cache
    localStorage.removeItem('timeline_prompts_cache');
    localStorage.removeItem('cached_timeline_categories');
    localStorage.removeItem('cached_timeline_styles');
    
    // Clear regular prompts cache too
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
      console.log('Removed: ' + key);
    });
    
    // Clear prompts cache timestamp
    localStorage.removeItem('prompts_cache_timestamp');
    
    document.body.innerHTML = '<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 100px auto; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"><h1 style="color: #0070f3;">Cache Cleared!</h1><p style="font-size: 18px; margin: 20px 0;">Your browser cache for PromptVeo3 has been cleared successfully.</p><p>The page will redirect to the dashboard in 3 seconds...</p><a href="/dashboard" style="display: inline-block; background: #0070f3; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: 500;">Return to Dashboard</a></div>';
    
    // Redirect after a delay
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 3000);
  `;

  // Create an HTML page with the script
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Clearing Cache...</title>
        <meta name="robots" content="noindex, nofollow">
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #f9fafb;
          }
          .loader {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #0070f3;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1 {
            margin-top: 0;
            color: #111827;
          }
          p {
            color: #6b7280;
            margin-bottom: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loader"></div>
          <h1>Clearing Cache...</h1>
          <p>Please wait while we reset your application cache.</p>
        </div>
        <script>
          ${clearCacheScript}
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
} 