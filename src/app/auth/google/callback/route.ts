import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-oauth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent('No authorization code received')}`)
  }

  try {
    const redirectUri = `${requestUrl.origin}/auth/google/callback`
    
    // Exchange code for tokens
    const tokenData = await exchangeCodeForTokens(code, redirectUri)
    
    if (!tokenData.access_token) {
      throw new Error('No access token received')
    }

    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokenData.access_token)
    
    if (!userInfo.email) {
      throw new Error('No email received from Google')
    }

    // Create Supabase session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Sign in or sign up user with Supabase using the Google user info
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userInfo.email,
      password: 'oauth-user-' + userInfo.id, // Temporary password for OAuth users
    })

    if (authError && authError.message.includes('Invalid login credentials')) {
      // User doesn't exist, create them
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: userInfo.email,
        password: 'oauth-user-' + userInfo.id,
        options: {
          data: {
            name: userInfo.name,
            avatar_url: userInfo.picture,
            provider: 'google',
            provider_id: userInfo.id,
          },
          emailRedirectTo: undefined // Skip email confirmation for OAuth users
        }
      })

      if (signUpError) {
        console.error('Supabase sign up error:', signUpError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(signUpError.message)}`)
      }

      // If user was created but needs email confirmation, auto-confirm them
      if (signUpData.user && !signUpData.session) {
        // For OAuth users, we'll create a session manually since they don't need email confirmation
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userInfo.email,
          password: 'oauth-user-' + userInfo.id,
        })

        if (signInError) {
          console.error('Auto sign-in error:', signInError)
          return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent('Authentication failed')}`)
        }
      }
    } else if (authError) {
      console.error('Supabase auth error:', authError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(authError.message)}`)
    }

    console.log('Google OAuth successful, redirecting to dashboard')
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)

  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent('Authentication failed')}`)
  }
} 