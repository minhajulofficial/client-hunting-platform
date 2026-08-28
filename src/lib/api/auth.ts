import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

export interface ResolvedAuth { userId: string|null; email?: string|null; via: 'session'|'extension_token'|null; error?: string }

export async function resolveUser(req: Request): Promise<{ auth: ResolvedAuth; supabase: any }> {
  if(!isSupabaseConfigured()) return { auth:{ userId:null, via:null, error:'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' }, supabase:null }
  const supabase = await createClient() as any
  try{
    const { data:{ user } } = await supabase.auth.getUser()
    if(user?.id){
      // Use service role to ensure users row exists (bypasses RLS)
      try {
        const svc = await createServiceClient() as any
        await svc.from('users').upsert({
          id: user.id,
          email: user.email || 'unknown',
          name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: user.created_at || new Date().toISOString()
        }, { onConflict: 'id' })
      } catch { /* trigger or backfill handles this */ }
      return { auth:{ userId:user.id, email: user.email, via:'session' }, supabase }
    }
  }catch{}
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if(token){
    const { data: sess, error } = await supabase.from('extension_sessions').select('user_id, expires_at').eq('token', token).maybeSingle()
    if(error) return { auth:{ userId:null, via:null, error:'Session lookup failed: '+error.message }, supabase }
    if(!sess) return { auth:{ userId:null, via:null, error:'Invalid extension token. Reconnect the extension.' }, supabase }
    if(sess.expires_at && new Date(sess.expires_at).getTime() < Date.now()) return { auth:{ userId:null, via:null, error:'Extension session expired. Click Reconnect in the extension.' }, supabase }
    // Use service role to ensure users row exists
    try {
      const svc = await createServiceClient() as any
      await svc.from('users').upsert({ id: sess.user_id, email: 'unknown', created_at: new Date().toISOString() }, { onConflict: 'id' })
    } catch { /* trigger or backfill handles this */ }
    return { auth:{ userId: sess.user_id, via:'extension_token' }, supabase }
  }
  return { auth:{ userId:null, via:null, error:'Unauthorized. Login to the CRM (or reconnect the extension).' }, supabase }
}
