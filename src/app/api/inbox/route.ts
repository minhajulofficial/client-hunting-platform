import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'

export async function OPTIONS(){ return preflight() }

export async function GET(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)
  const { data, error } = await supabase.from('email_threads').select('*, email_messages(*)').eq('user_id', auth.userId).order('updated_at',{ ascending:false }).limit(50)
  if(error) return fail('Failed to load inbox - '+error.message, 500)
  return ok(data || [])
}
