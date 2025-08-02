'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

export const createClient = () => {
  return createClientComponentClient<Database>({
    cookieOptions: {
      name: 'sb-promptveo3',
      domain: '',
      path: '/',
      sameSite: 'lax',
      secure: true
    },
  })
}

export default createClient 