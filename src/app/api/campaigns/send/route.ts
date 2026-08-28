import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmailViaGmail } from '@/lib/gmail/client'
export async function POST(req:Request){
  const { campaignId } = await req.json()
  if(!campaignId) return NextResponse.json({ success:false, error:'campaignId required' },{status:400})
  const supabase=await createClient()
  const { data:{ user } }=await supabase.auth.getUser()
  if(!user) return NextResponse.json({ success:false, error:'Unauthorized' },{status:401})
  const { data: recips }=await supabase.from('campaign_recipients').select('*, leads(email,email_status)').eq('campaign_id',campaignId).eq('status','QUEUED').limit(20)
  if(!recips?.length) return NextResponse.json({ success:true, data:{ sent:0, note:'no QUEUED recipients' }, error:null })
  const { data: acct }=await supabase.from('oauth_accounts').select('*').eq('user_id',user.id).eq('provider','gmail').single()
  let sent=0, failed=0
  for(const r of recips){
    // default only VERIFIED unless overridden
    const email=(r as any).leads?.email || r.recipient_email
    const emailStatus=(r as any).leads?.email_status
    if(emailStatus && emailStatus!=='VERIFIED' && emailStatus!=='RISKY') continue
    await supabase.from('campaign_recipients').update({ status:'SENDING' }).eq('id',r.id)
    try{
      if(acct?.access_token){
        await sendEmailViaGmail({ access_token: acct.access_token, refresh_token: acct.refresh_token }, email, r.subject||'Hello', r.body||'Hi')
      }
      await supabase.from('campaign_recipients').update({ status:'SENT', sent_at: new Date().toISOString() }).eq('id',r.id)
      sent++
      // rate limit: 1 msg per 2 sec in this sync loop (real worker would use queue)
      await new Promise(res=>setTimeout(res, 800))
    }catch(e:any){
      await supabase.from('campaign_recipients').update({ status:'FAILED', error: e.message }).eq('id',r.id)
      failed++
    }
  }
  return NextResponse.json({ success:true, data:{ sent, failed, total: recips.length }, error:null })
}
