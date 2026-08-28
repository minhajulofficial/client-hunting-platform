import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { sendEmailViaGmail } from '@/lib/gmail/client'
import { z } from 'zod'

const bodySchema = z.object({ to: z.string().email().optional() })

export async function OPTIONS(){ return preflight() }

export async function GET(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)
  if(!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return fail('NOT CONFIGURED - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then reconnect Gmail', 503)
  const { data: acct } = await supabase.from('oauth_accounts').select('provider, scope, expiry_date').eq('user_id', auth.userId).eq('provider','gmail').maybeSingle()
  if(!acct) return fail('Gmail not connected. Go to Integrations -> Connect Gmail.', 400)
  return ok({ connected:true, scope: acct.scope, expires: acct.expiry_date, note:'Gmail API: Connected ✓' })
}

export async function POST(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  let json: unknown = {}
  try{ json = await req.json() }catch{ /* body optional */ }
  const parsed = bodySchema.safeParse(json)
  if(!parsed.success) return fail('Provide a valid "to" email address', 422)

  const { data: acct } = await supabase.from('oauth_accounts').select('*').eq('user_id', auth.userId).eq('provider','gmail').maybeSingle()
  if(!acct?.access_token) return fail('Gmail not connected. Go to Integrations -> Connect Gmail.', 400)

  const { data: userRes } = await supabase.auth.getUser()
  const to = parsed.data.to || userRes?.user?.email
  if(!to) return fail('No recipient. Provide "to" in the request body.', 422)

  try{
    const sent = await sendEmailViaGmail({ access_token: acct.access_token, refresh_token: acct.refresh_token }, to, 'Client Hunter - test email', '<p>This is a real test email sent from your Client Hunter CRM via the Gmail API.</p>')
    await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'gmail_test_email', details:{ to, gmail_message_id: sent.id } })
    return ok({ sent:true, to, gmail_message_id: sent.id, note:'Test email sent ✓ - campaign sending is now enabled' })
  }catch(e){
    const message = e instanceof Error ? e.message : 'Unknown error'
    await supabase.from('system_logs').insert({ level:'error', message:'gmail_test_failed', details:{ error: message } })
    return fail('Gmail API: Failed ✕ - '+message+'. Please reconnect Gmail.', 502)
  }
}
