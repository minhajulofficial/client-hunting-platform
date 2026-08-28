import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { importPayloadSchema, formatZodError } from '@/lib/validation/schemas'
import { getEmailVerifier } from '@/lib/verification/email'
import { verifyPhone } from '@/lib/verification/phone'
import { scoreLead } from '@/lib/scoring'
import { z } from 'zod'

export async function OPTIONS(){ return preflight() }

export async function POST(req: Request){
  try{
    const { auth, supabase } = await resolveUser(req)
    if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
    if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

    let json: unknown
    try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }

    const parsed = importPayloadSchema.safeParse(json)
    if(!parsed.success) return fail('Validation failed - '+formatZodError(parsed.error as z.ZodError), 422)

    const { leads, projectId } = parsed.data
    const verifier = getEmailVerifier()

    let inserted = 0
    let duplicates = 0
    let possibleDuplicates = 0
    let failed = 0
    const errors: string[] = []

    for(const lead of leads){
      // Server-side verification - never trust extension payload
      const record: Record<string, unknown> = {
        business_name: lead.business_name.trim(),
        business_type: lead.business_type ?? null,
        niche: lead.niche ?? null,
        sub_niche: lead.sub_niche ?? null,
        country: lead.country ?? null,
        state: lead.state ?? null,
        city: lead.city ?? null,
        address: lead.address ?? null,
        postal_code: lead.postal_code ?? null,
        website: lead.website ?? null,
        contact_first_name: lead.contact_first_name ?? null,
        contact_last_name: lead.contact_last_name ?? null,
        contact_position: lead.contact_position ?? null,
        email: lead.email ? lead.email.toLowerCase().trim() : null,
        phone: lead.phone ?? null,
        facebook: lead.facebook ?? null,
        instagram: lead.instagram ?? null,
        linkedin: lead.linkedin ?? null,
        source: lead.source ?? 'extension',
        source_url: lead.source_url ?? null,
        email_status: 'UNKNOWN',
        phone_status: 'UNKNOWN',
        project_id: projectId ?? null,
        status: 'NEW',
        user_id: auth.userId,
      }

      if(record.email){
        const v = await verifier.verify(record.email as string)
        record.email_status = v.status
        if(v.status === 'INVALID'){ record.status = 'INVALID' }
      }
      if(record.phone){
        record.phone_status = verifyPhone(record.phone as string, (record.country as string) || 'US').status
      }
      record.lead_score = scoreLead(record)

      // Multi-signal duplicate detection (email / phone / website domain / business name)
      let isDuplicate = false
      let isPossible = false
      if(record.email){
        const { data } = await supabase.from('leads').select('id').eq('user_id', auth.userId).eq('email', record.email).limit(1)
        if(data && data.length > 0) isDuplicate = true
      }
      if(!isDuplicate && record.phone){
        const { data } = await supabase.from('leads').select('id').eq('user_id', auth.userId).eq('phone', record.phone).limit(1)
        if(data && data.length > 0) isDuplicate = true
      }
      if(!isDuplicate && record.website){
        let domain = String(record.website)
        try{ domain = new URL(domain.startsWith('http')? domain : 'https://'+domain).hostname.replace(/^www\./,'') }catch{}
        const { data } = await supabase.from('leads').select('id').eq('user_id', auth.userId).ilike('website', '%'+domain+'%').limit(1)
        if(data && data.length > 0) isDuplicate = true
      }
      if(!isDuplicate){
        const { data } = await supabase.from('leads').select('id').eq('user_id', auth.userId).ilike('business_name', String(record.business_name)).limit(1)
        if(data && data.length > 0) isPossible = true
      }

      if(isDuplicate){ duplicates++; continue }
      if(isPossible){ possibleDuplicates++; record.status = 'REVIEW' }

      const { data: insertedRow, error } = await supabase.from('leads').insert(record).select('id').maybeSingle()
      if(error){ failed++; errors.push(error.message); continue }
      inserted++

      if(insertedRow?.id){
        await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'lead_imported', entity_type:'lead', entity_id: insertedRow.id, details:{ source: record.source, email_status: record.email_status, lead_score: record.lead_score } })
        await supabase.from('lead_verifications').insert({ lead_id: insertedRow.id, type:'email', status: record.email_status, details:{ verified_at: new Date().toISOString() } })
      }
    }

    if(inserted === 0 && failed > 0) return fail('Import failed - '+errors.slice(0,3).join('; '), 500)

    return ok({ received: leads.length, imported: inserted, duplicates, possible_duplicates: possibleDuplicates, failed, errors: errors.slice(0,5) })
  }catch(e){
    const message = e instanceof Error ? e.message : 'Unknown error'
    return fail('Import failed - '+message, 500)
  }
}
