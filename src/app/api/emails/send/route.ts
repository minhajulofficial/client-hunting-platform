import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { emailSendSchema, formatZodError } from '@/lib/validation/schemas'
import { sendEmailViaGmail } from '@/lib/gmail/client'
import type { z } from 'zod'

export async function OPTIONS(){ return preflight() }

export async function POST(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  let json: unknown
  try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }
  const parsed = emailSendSchema.safeParse(json)
  if(!parsed.success) return fail('Validation failed - '+formatZodError(parsed.error as z.ZodError), 422)
  const { to, subject, body, cc, bcc, leadId } = parsed.data

  // Unresolved template variables must never reach a real lead (spec 31)
  const unresolved = /\{\{\s*[a-z_]+\s*\}\}/i
  if(unresolved.test(subject) || unresolved.test(body)) return fail('Message still contains unresolved variables (e.g. {{first_name}}). Personalize it before sending.', 422)

  const { data: acct } = await supabase.from('oauth_accounts').select('*').eq('user_id', auth.userId).eq('provider','gmail').maybeSingle()
  if(!acct?.access_token){
    return fail('Gmail is not connected, so nothing was sent. Go to Integrations -> Connect Gmail.', 400)
  }

  try{
    const sent = await sendEmailViaGmail({ access_token: acct.access_token, refresh_token: acct.refresh_token }, to, subject, body, { cc: cc || undefined, bcc: bcc || undefined })
    if(leadId){
      await supabase.from('leads').update({ status:'CONTACTED', last_contacted: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', leadId).eq('user_id', auth.userId)
      await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'email_sent', entity_type:'lead', entity_id: leadId, details:{ to, subject, gmail_message_id: sent.id, gmail_thread_id: sent.threadId } })
    }
    return ok({ sent:true, to, gmail_message_id: sent.id, gmail_thread_id: sent.threadId })
  }catch(e){
    const message = e instanceof Error ? e.message : 'Unknown error'
    await supabase.from('system_logs').insert({ level:'error', message:'email_send_failed', details:{ to, error: message } })
    return fail('Send failed - '+message+'. Try Integrations -> Test Gmail Connection.', 502)
  }
}
