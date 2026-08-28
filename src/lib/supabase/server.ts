import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Mock client used ONLY when Supabase env vars are missing.
 * It keeps `next build` working and makes pages render a "Setup required" banner
 * instead of crashing. It never returns fake business data - always empty.
 */
function mockClient(){
  const empty = { data: null as unknown, error: { message: 'Supabase not configured' } }
  const emptyList = { data: [] as unknown[], error: null as unknown }
  const chain: Record<string, unknown> = {}
  const methods = ['select','eq','neq','ilike','like','in','is','gt','gte','lt','lte','order','range','limit','filter','match','not','or','contains','textSearch']
  for(const m of methods){ chain[m] = () => chain }
  chain.single = async () => empty
  chain.maybeSingle = async () => empty
  chain.then = (resolve: (v: unknown)=>unknown) => Promise.resolve(emptyList).then(resolve)
  chain.insert = () => chain
  chain.upsert = () => chain
  chain.update = () => chain
  chain.delete = () => chain
  return {
    from: () => chain,
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      exchangeCodeForSession: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    },
  } as unknown as ReturnType<typeof createServerClient>
}

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return mockClient()
  const cookieStore = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try{
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never))
        }catch{ /* called from a Server Component - safe to ignore */ }
      },
    },
  })
}

export async function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return mockClient()
  const { createClient: createSupabase } = await import('@supabase/supabase-js')
  return createSupabase(url, key) as unknown as ReturnType<typeof createServerClient>
}

export function isSupabaseConfigured(){
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}
