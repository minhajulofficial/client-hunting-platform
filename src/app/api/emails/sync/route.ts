import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listMessages, getMessage } from '@/lib/gmail/client'
export async function POST(){
  const supabase=await createClient()
  const { data:{ user } }=await supabase.auth.getUser()
  if(!user) return NextResponse.json({ success:false, error:'Unauthorized' },{status:401})
  const { data: acct }=await supabase.from('oauth_accounts').select('*').eq('user_id',user.id).eq('provider','gmail').single()
  if(!acct?.access_token) return NextResponse.json({ success:false, error:'Gmail not connected. Go to /integrations -> Connect Gmail.' },{status:400})
  try{
    const tokens={ access_token: acct.access_token, refresh_token: acct.refresh_token }
    const messages=await listMessages(tokens, 'in:inbox newer_than:7d')
    let synced=0
    for(const m of messages.slice(0,5)){
      const full=await getMessage(tokens, m.id!)
      const threadId=(full as any).threadId
      const headers=(full as any).payload?.headers || []
      const from=headers.find((h:any)=>h.name==='From')?.value || ''
      const subject=headers.find((h:any)=>h.name==='Subject')?.value || ''
      // try match lead by from email
      const emailMatch=from.match(/<([^>]+)>/)?.[1] || from
      let leadId=null
      if(emailMatch){
        const { data: lead }=await supabase.from('leads').select('id').ilike('email', emailMatch).limit(1).single()
        leadId=lead?.id||null
        if(leadId) await supabase.from('leads').update({ status:'REPLIED' }).eq('id',leadId)
      }
      // upsert thread
      const { data: thread }=await supabase.from('email_threads').upsert({ user_id:user.id, gmail_thread_id: threadId, lead_id: leadId, subject, snippet: (full as any).snippet, updated_at: new Date().toISOString() },{ onConflict:'gmail_thread_id' }).select().single()
      if(thread){
        await supabase.from('email_messages').insert({ thread_id: thread.id, gmail_message_id: m.id, from_email: from, to_email: user.email!, subject, body: (full as any).snippet, snippet: (full as any).snippet, direction:'inbound' })
        synced++
      }
    }
    await supabase.from('activity_logs').insert({ user_id:user.id, action:'gmail_sync', details:{ synced } })
    return NextResponse.json({ success:true, data:{ synced, total: messages.length }, error:null })
  }catch(e:any){
    return NextResponse.json({ success:false, error:e.message },{status:500})
  }
}
export async function GET(){ return NextResponse.json({ success:true, data:{ status:'idle', hint:'POST to sync last 7d inbox, matches leads by email, status -> REPLIED' }, error:null }) }
