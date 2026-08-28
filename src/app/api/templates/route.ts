import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2,'Template name required'),
  subject: z.string().min(1,'Subject required'),
  body: z.string().min(1,'Body required'),
  service: z.string().optional().nullable(),
  niche: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  language: z.string().optional().default('en'),
})

export async function OPTIONS(){ return preflight() }

export async function GET(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)
  const { data, error } = await supabase.from('email_templates').select('*').eq('user_id', auth.userId).order('created_at',{ascending:false}).limit(100)
  if(error) return fail('Failed to load templates - '+error.message, 500)
  return ok(data || [])
}

export async function POST(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)
  let json: unknown
  try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }
  const parsed = schema.safeParse(json)
  if(!parsed.success) return fail('Validation failed - '+parsed.error.issues.map(i=>i.message).join('; '), 422)
  const { data, error } = await supabase.from('email_templates').insert({ ...parsed.data, user_id: auth.userId, status:'active' }).select('*').maybeSingle()
  if(error) return fail('Create failed - '+error.message, 500)
  return ok(data)
}

export async function DELETE(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)
  const id = new URL(req.url).searchParams.get('id')
  if(!id) return fail('id query param required', 400)
  const { error } = await supabase.from('email_templates').delete().eq('id', id).eq('user_id', auth.userId)
  if(error) return fail('Delete failed - '+error.message, 500)
  return ok({ deleted:true, id })
}
