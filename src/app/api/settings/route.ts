import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { z } from 'zod'

const settingsSchema = z.object({
  site_name: z.string().min(1).max(100).optional(),
  default_country: z.string().min(2).max(2).optional(),
  timezone: z.string().optional(),
  ai_model: z.string().optional(),
  campaign_daily_limit: z.number().int().min(1).max(500).optional(),
  campaign_delay_ms: z.number().int().min(500).max(30000).optional(),
  follow_up_day0: z.boolean().optional(),
  follow_up_day3: z.boolean().optional(),
  follow_up_day7: z.boolean().optional(),
  stop_on_replied: z.boolean().optional(),
  stop_on_unsubscribed: z.boolean().optional(),
})

export async function OPTIONS(){ return preflight() }

export async function GET(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)
  const { data } = await supabase.from('user_settings').select('*').eq('user_id', auth.userId).maybeSingle()
  return ok(data || {
    site_name: 'Client Hunting CRM',
    default_country: 'US',
    timezone: 'UTC',
    ai_model: 'gpt-4o-mini',
    campaign_daily_limit: 50,
    campaign_delay_ms: 800,
    follow_up_day0: true,
    follow_up_day3: true,
    follow_up_day7: false,
    stop_on_replied: true,
    stop_on_unsubscribed: true,
  })
}

export async function PUT(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  let json: unknown
  try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }
  const parsed = settingsSchema.safeParse(json)
  if(!parsed.success) return fail('Validation failed - '+parsed.error.issues.map(i=>i.message).join('; '), 422)

  const { data: existing } = await supabase.from('user_settings').select('user_id').eq('user_id', auth.userId).maybeSingle()
  const payload = { ...parsed.data, user_id: auth.userId, updated_at: new Date().toISOString() }

  if(existing){
    const { error } = await supabase.from('user_settings').update(payload).eq('user_id', auth.userId)
    if(error) return fail('Update failed - '+error.message, 500)
  } else {
    const { error } = await supabase.from('user_settings').insert({ ...payload, created_at: new Date().toISOString() })
    if(error) return fail('Create failed - '+error.message, 500)
  }

  await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'settings_updated', entity_type:'settings', details:{ fields: Object.keys(parsed.data) } })
  return ok({ saved: true })
}
