import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
function mockClient(){
  const chain:any = {
    select: () => chain,
    eq: () => chain,
    ilike: () => chain,
    order: () => chain,
    limit: () => Promise.resolve({ data: [], error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    upsert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
  }
  return {
    from: () => chain,
    auth: { getUser: async () => ({ data: { user: null }, error: null }), exchangeCodeForSession: async () => ({}) },
  } as any
}
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return mockClient()
  const cookieStore = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never)) },
    },
  })
}
export async function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return mockClient()
  const { createClient: createSupabase } = await import('@supabase/supabase-js')
  return createSupabase(url, key)
}
export function isSupabaseConfigured(){ return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
