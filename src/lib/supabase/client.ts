import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // Return mock for build time - login will show setup banner instead of throwing
    return {
      auth: {
        signInWithOAuth: async () => ({ error: { message: 'Supabase not configured - set NEXT_PUBLIC_SUPABASE_URL/ANON_KEY' } }),
        getUser: async () => ({ data: { user: null } }),
        exchangeCodeForSession: async () => ({}),
      },
      from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }),
    } as any
  }
  return createBrowserClient(url, key)
}
export function isSupabaseConfigured(){ return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
