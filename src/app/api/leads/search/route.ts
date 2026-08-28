import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'

export async function OPTIONS(){ return preflight() }

export async function GET(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  let q = supabase.from('leads').select('*').eq('user_id', auth.userId).order('created_at',{ ascending:false }).limit(100)
  for(const key of ['country','state','city','niche','status','email_status','project_id'] as const){
    const v = searchParams.get(key)
    if(v) q = q.eq(key, v)
  }
  const term = searchParams.get('q')
  if(term) q = q.ilike('business_name', '%'+term+'%')

  const { data, error } = await q
  if(error) return fail('Search failed - '+error.message, 500)
  return ok(data || [])
}
