import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { projectInputSchema, formatZodError } from '@/lib/validation/schemas'
import type { z } from 'zod'

export async function OPTIONS(){ return preflight() }

export async function GET(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)
  const { data, error } = await supabase.from('projects').select('*').eq('user_id', auth.userId).order('created_at',{ ascending:false }).limit(100)
  if(error) return fail('Failed to load projects - '+error.message, 500)
  return ok(data || [])
}

export async function POST(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized - login required', 401)

  let json: unknown
  try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }
  const parsed = projectInputSchema.safeParse(json)
  if(!parsed.success) return fail('Validation failed - '+formatZodError(parsed.error as z.ZodError), 422)

  const { data, error } = await supabase.from('projects').insert({ ...parsed.data, user_id: auth.userId }).select('*').maybeSingle()
  if(error) return fail('Create failed - '+error.message, 500)
  if(data?.id) await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'project_created', entity_type:'project', entity_id: data.id, details:{ name: parsed.data.name } })
  return ok(data)
}
