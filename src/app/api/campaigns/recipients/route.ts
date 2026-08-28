import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { z } from 'zod'

const schema = z.object({
  campaign_id: z.string().uuid('campaign_id must be a uuid'),
  lead_ids: z.array(z.string().uuid()).min(1).max(500).optional(),
  lead_id: z.string().uuid().optional(),
  subject: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
})

export async function OPTIONS(){ return preflight() }

export async function POST(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  let json: unknown
  try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }
  const parsed = schema.safeParse(json)
  if(!parsed.success) return fail('Validation failed - '+parsed.error.issues.map(i=>i.message).join('; '), 422)

  const ids = parsed.data.lead_ids || (parsed.data.lead_id ? [parsed.data.lead_id] : [])
  if(ids.length===0) return fail('Provide lead_id or lead_ids', 422)

  // Ownership check - the campaign must belong to the caller (prevents IDOR)
  const { data: campaign } = await supabase.from('campaigns').select('id').eq('id', parsed.data.campaign_id).eq('user_id', auth.userId).maybeSingle()
  if(!campaign) return fail('Campaign not found (or not yours)', 404)

  // Only the caller's own leads, and only usable email addresses
  const { data: leads, error: leadErr } = await supabase.from('leads').select('id,email,email_status,status').in('id', ids).eq('user_id', auth.userId)
  if(leadErr) return fail('Failed to load leads - '+leadErr.message, 500)

  const blocked = ['UNSUBSCRIBED','NOT_INTERESTED','WON','INVALID']
  let added=0, skippedNoEmail=0, skippedBlocked=0, skippedExisting=0
  const errors:string[]=[]

  for(const lead of leads || []){
    if(!lead.email){ skippedNoEmail++; continue }
    if(blocked.includes(lead.status)){ skippedBlocked++; continue }
    const { data: existing } = await supabase.from('campaign_recipients').select('id').eq('campaign_id', parsed.data.campaign_id).eq('lead_id', lead.id).limit(1)
    if(existing && existing.length>0){ skippedExisting++; continue }
    const { error } = await supabase.from('campaign_recipients').insert({
      campaign_id: parsed.data.campaign_id,
      lead_id: lead.id,
      recipient_email: lead.email,
      subject: parsed.data.subject ?? null,
      body: parsed.data.body ?? null,
      status:'QUEUED',
    })
    if(error){ errors.push(error.message); continue }
    added++
  }

  await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'campaign_recipients_added', entity_type:'campaign', entity_id: parsed.data.campaign_id, details:{ added, skippedNoEmail, skippedBlocked, skippedExisting } })
  return ok({ added, skipped_no_email: skippedNoEmail, skipped_blocked: skippedBlocked, skipped_already_added: skippedExisting, errors: errors.slice(0,5) })
}
