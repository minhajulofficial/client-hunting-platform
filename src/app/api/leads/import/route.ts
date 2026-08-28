import { NextResponse } from 'next/server'
import { createClient as createService } from '@/lib/supabase/server'
import { getEmailVerifier } from '@/lib/verification/email'
export async function POST(req: Request){
  try{
    const { leads, projectId } = await req.json()
    if (!Array.isArray(leads)) return NextResponse.json({ success:false, error:'leads must be array' }, { status:400 })
    const supabase = await createService()
    const { data:{ user } } = await supabase.auth.getUser()
    // Validate + dedup + verify (server-side, never trust extension)
    const verifier = getEmailVerifier()
    let inserted=0; const errors:string[]=[]
    for (const raw of leads){
      if (!raw.business_name) { errors.push('missing business_name'); continue }
      if (raw.email){
        const v = await verifier.verify(raw.email)
        raw.email_status = v.status
      }
      // dedup check by email/website
      let isDup=false
      if (raw.email){
        const { data: existing } = await supabase.from('leads').select('id').eq('email', raw.email).limit(1)
        if (existing && existing.length>0) isDup=true
      }
      if (isDup) continue
      const { error } = await supabase.from('leads').insert({
        business_name: raw.business_name, website: raw.website, email: raw.email, email_status: raw.email_status || 'UNKNOWN',
        phone: raw.phone, city: raw.city, state: raw.state, country: raw.country, niche: raw.niche,
        contact_first_name: raw.contact_first_name, contact_last_name: raw.contact_last_name, contact_position: raw.contact_position,
        facebook: raw.facebook, instagram: raw.instagram, linkedin: raw.linkedin,
        source: raw.source, source_url: raw.source_url, project_id: projectId || null,
        status: 'NEW', user_id: user?.id || null
      })
      if (!error) inserted++
      else errors.push(error.message)
    }
    return NextResponse.json({ success:true, data:{ inserted, errors, total: leads.length }, error:null })
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 })}
}
