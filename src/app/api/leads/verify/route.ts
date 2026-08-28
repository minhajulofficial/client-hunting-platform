import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { getEmailVerifier } from '@/lib/verification/email'
import { verifyPhone } from '@/lib/verification/phone'
import { z } from 'zod'

const schema = z.object({
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  country: z.string().optional().nullable(),
})

export async function OPTIONS(){ return preflight() }

export async function POST(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  let json: unknown
  try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }
  const parsed = schema.safeParse(json)
  if(!parsed.success) return fail('Validation failed - provide email and/or phone', 422)
  const { email, phone, leadId, country } = parsed.data
  if(!email && !phone) return fail('Provide an email or a phone number to verify', 422)

  const result: Record<string, unknown> = {}
  if(email) result.email = await getEmailVerifier().verify(email)
  if(phone) result.phone = verifyPhone(phone, country || 'US')

  // Persist so the CRM reflects the verification (only for the caller's own lead)
  if(leadId){
    const { data: lead } = await supabase.from('leads').select('id').eq('id', leadId).eq('user_id', auth.userId).maybeSingle()
    if(lead){
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if(result.email) patch.email_status = (result.email as { status:string }).status
      if(result.phone) patch.phone_status = (result.phone as { status:string }).status
      await supabase.from('leads').update(patch).eq('id', leadId).eq('user_id', auth.userId)
      await supabase.from('lead_verifications').insert({ lead_id: leadId, type: email? 'email':'phone', status: (patch.email_status || patch.phone_status) as string, details: result })
      await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'lead_verified', entity_type:'lead', entity_id: leadId, details:{ email_status: patch.email_status, phone_status: patch.phone_status } })
      result.saved = true
    }
  }
  return ok(result)
}
