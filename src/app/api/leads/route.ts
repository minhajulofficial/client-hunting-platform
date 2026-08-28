import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { leadInputSchema, formatZodError } from '@/lib/validation/schemas'
import { getEmailVerifier } from '@/lib/verification/email'
import { scoreLead } from '@/lib/scoring'
import type { z } from 'zod'

export async function OPTIONS(){ return preflight() }

export async function GET(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') || '25')))
  const from = (page-1)*perPage
  const to = from + perPage - 1

  let q = supabase.from('leads').select('*', { count:'exact' }).eq('user_id', auth.userId).order('created_at',{ ascending:false }).range(from, to)
  for(const key of ['country','state','city','niche','status','email_status','project_id'] as const){
    const v = url.searchParams.get(key)
    if(v) q = q.eq(key, v)
  }
  const search = url.searchParams.get('q')
  if(search) q = q.ilike('business_name', '%'+search+'%')

  const { data, error, count } = await q
  if(error) return fail('Failed to load leads - '+error.message, 500)
  return ok({ leads: data || [], page, per_page: perPage, total: count ?? (data?.length || 0) })
}

export async function POST(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  let json: unknown
  try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }
  const parsed = leadInputSchema.safeParse(json)
  if(!parsed.success) return fail('Validation failed - '+formatZodError(parsed.error as z.ZodError), 422)

  const lead = parsed.data
  const record: Record<string, unknown> = { ...lead, user_id: auth.userId, status:'NEW', email_status:'UNKNOWN', source: lead.source || 'manual' }
  if(lead.email){
    const v = await getEmailVerifier().verify(lead.email)
    record.email_status = v.status
  }
  record.lead_score = scoreLead(record)

  const { data, error } = await supabase.from('leads').insert(record).select('*').maybeSingle()
  if(error) return fail('Create failed - '+error.message, 500)
  if(data?.id) await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'lead_created', entity_type:'lead', entity_id: data.id, details:{ source: record.source } })
  return ok(data)
}
