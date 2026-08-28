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
    if(!auth.userId) return fail(auth.error || 'Unauthorized - login required', 401)

    let json: unknown
    try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }

    const parsed = importPayloadSchema.safeParse(json)
    if(!parsed.success) return fail('Validation failed - '+formatZodError(parsed.error as z.ZodError), 422)

    const { leads, projectId } = parsed.data
    const verifier = getEmailVerifier()
    let inserted=0, duplicates=0, failed=0
    const errors:string[]=[]

    for(const lead of leads){
      const record: Record<string, unknown> = {
        business_name: lead.business_name.trim(),
        email: lead.email ? lead.email.toLowerCase().trim() : null,
        phone: lead.phone ?? null,
        website: lead.website ?? null,
        city: lead.city ?? null,
        state: lead.state ?? null,
        country: lead.country ?? null,
        niche: lead.niche ?? null,
        contact_first_name: lead.contact_first_name ?? null,
        contact_last_name: lead.contact_last_name ?? null,
        contact_position: lead.contact_position ?? null,
        facebook: lead.facebook ?? null,
        instagram: lead.instagram ?? null,
        linkedin: lead.linkedin ?? null,
        source: lead.source ?? 'csv',
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
      }
      if(record.phone){ record.phone_status = verifyPhone(record.phone as string).status }
      record.lead_score = scoreLead(record)

      if(record.email){
        const { data } = await supabase.from('leads').select('id').eq('user_id', auth.userId).eq('email', record.email).limit(1)
        if(data && data.length>0){ duplicates++; continue }
      }
      const { data: row, error } = await supabase.from('leads').insert(record).select('id').maybeSingle()
      if(error){ failed++; errors.push(error.message); continue }
      inserted++
      if(row?.id) await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'lead_imported', entity_type:'lead', entity_id: row.id, details:{ source: record.source } })
    }

    if(inserted===0 && failed>0) return fail('Import failed - '+errors.slice(0,3).join('; '), 500)
    return ok({ received: leads.length, imported: inserted, duplicates, failed, errors: errors.slice(0,5) })
  }catch(e){
    const message = e instanceof Error ? e.message : 'Unknown error'
    return fail('Import failed - '+message, 500)
  }
}
