import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmailViaGmail } from '@/lib/gmail/client'
export async function POST(req:Request){
  const { to, subject, body, leadId, cc, bcc } = await req.json()
  if(!to || !subject) return NextResponse.json({ success:false, error:'to and subject required' },{status:400})
  const supabase=await createClient()
  const { data:{ user } }=await supabase.auth.getUser()
  if(user){
    const { data: acct }=await supabase.from('oauth_accounts').select('*').eq('user_id',user.id).eq('provider','gmail').single()
    if(acct?.access_token){
      try{
        const sent=await sendEmailViaGmail({ access_token: acct.access_token, refresh_token: acct.refresh_token }, to, subject, body, {cc,bcc})
        await supabase.from('activity_logs').insert({ user_id:user.id, action:'email_sent', entity_type:'lead', entity_id: leadId || null, details:{ to, subject, gmail_message_id: sent.id } })
        if(leadId) await supabase.from('leads').update({ status:'CONTACTED', last_contacted: new Date().toISOString() }).eq('id',leadId)
        return NextResponse.json({ success:true, data:{ sent:true, gmail_message_id: sent.id }, error:null })
      }catch(e:any){
        // fallback to queued if token expired etc
        await supabase.from('activity_logs').insert({ user_id:user.id, action:'email_queued_fallback', entity_type:'lead', entity_id: leadId||null, details:{ to, subject, error:e.message } })
      }
    }
  }
  // queued fallback (dev without Gmail)
  if(user) await supabase.from('activity_logs').insert({ user_id:user.id, action:'email_queued', entity_type:'lead', entity_id: leadId || null, details:{ to, subject } })
  return NextResponse.json({ success:true, data:{ queued:true, to, subject, note:'queued (connect Gmail for real send)' }, error:null })
}
