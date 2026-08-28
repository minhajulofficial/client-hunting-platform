import { NextResponse } from 'next/server'
import { createClient as createServer } from '@/lib/supabase/server'
import { getEmailVerifier } from '@/lib/verification/email'
function cors(res: NextResponse){ res.headers.set('Access-Control-Allow-Origin','*'); res.headers.set('Access-Control-Allow-Methods','GET,POST,OPTIONS'); res.headers.set('Access-Control-Allow-Headers','Content-Type, Authorization'); return res }
export async function OPTIONS(){ return cors(new NextResponse(null,{status:204})) }
export async function POST(req:Request){
  try{
    const supabase = await createServer() as any
    if(!supabase) return cors(NextResponse.json({ success:false, error:'Supabase not configured - set env vars' },{status:503}))
    // auth: supabase session OR extension token
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace('Bearer ','').trim()
    let userId: string|null = null
    const { data:{ user } } = await supabase.auth.getUser()
    if(user) userId = user.id
    else if(token){
      const { data: sess } = await supabase.from('extension_sessions').select('user_id').eq('token',token).single()
      if(sess) userId = sess.user_id
    }
    if(!userId) return cors(NextResponse.json({ success:false, error:'Unauthorized - login to CRM or use extension session token' },{status:401}))
    const body = await req.json()
    const leads = body.leads || body
    const projectId = body.projectId || null
    const normalized = (Array.isArray(leads)?leads:[]).map((l:any)=>({ business_name: l.business_name || l.businessName || 'Unknown', website: l.website, email: l.email, phone: l.phone, city: l.city, state: l.state, country: l.country, niche: l.niche, contact_first_name: l.contact_first_name || l.contactName?.split(' ')[0], contact_last_name: l.contact_last_name, contact_position: l.contact_position, facebook: l.facebook, instagram: l.instagram, linkedin: l.linkedin, source: l.source || 'extension', source_url: l.source_url || l.sourceUrl }))
    const verifier = getEmailVerifier()
    let inserted=0, duplicates=0
    for(const raw of normalized){
      if(!raw.business_name) continue
      if(raw.email){
        const v = await verifier.verify(raw.email)
        raw.email_status = v.status
        const { data: existing } = await supabase.from('leads').select('id').eq('email', raw.email).limit(1)
        if(existing && existing.length>0){ duplicates++; continue }
      }
      const { error } = await supabase.from('leads').insert({ business_name: raw.business_name, website: raw.website, email: raw.email, email_status: raw.email_status || 'UNKNOWN', phone: raw.phone, city: raw.city, state: raw.state, country: raw.country, niche: raw.niche, contact_first_name: raw.contact_first_name, contact_last_name: raw.contact_last_name, contact_position: raw.contact_position, facebook: raw.facebook, instagram: raw.instagram, linkedin: raw.linkedin, source: raw.source, source_url: raw.source_url, project_id: projectId, status:'NEW', user_id: userId })
      if(!error) inserted++
    }
    await supabase.from('activity_logs').insert({ user_id: userId, action:'extension_import', entity_type:'lead', details:{ inserted, duplicates, total: normalized.length } })
    return cors(NextResponse.json({ success:true, data:{ inserted, duplicates, total: normalized.length }, error:null }))
  }catch(e:any){ return cors(NextResponse.json({ success:false, error:e.message },{status:500})) }
}
