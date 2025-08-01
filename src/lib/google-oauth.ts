// Custom Google OAuth utility
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export const initiateGoogleSignIn = () => {
  const redirectUri = `${window.location.origin}/auth/callback`
  const scope = 'email profile'
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`

  window.location.href = googleAuthUrl
}

export const handleGoogleCallback = async (code: string) => {
  // This would handle the OAuth callback and exchange code for tokens
  // For now, we'll use Supabase's exchangeCodeForSession
  return { code }
} 