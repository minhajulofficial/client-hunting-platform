import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Composer } from '@/components/email/Composer'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
export default async function Inbox(){
  const configured=isSupabaseConfigured()
  let threads:any[]=[]
  if(configured){
    try{ const s=await createClient(); if(s){ const {data}=await s.from('email_threads').select('*').order('updated_at',{ascending:false}).limit(10); threads=data||[] } }catch{}
  }
  return <AppShell><h1 className="text-2xl font-bold">Inbox</h1><p className="text-sm text-zinc-500">Gmail-synced conversations matched to leads via thread ID — reply updates lead to REPLIED</p>
    {!configured && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm text-amber-800">Supabase not configured — inbox needs Supabase + Gmail OAuth. See docs/BEGINNER_SETUP.md</p></div>}
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      <Card><h3 className="font-semibold">Conversations</h3>
        {threads.length===0 ? <p className="text-sm text-zinc-500 mt-3">No conversations yet — connect Gmail at /integrations → Sync, then inbound replies will appear and update lead status.</p>
        : <div className="mt-3 space-y-2">{threads.map((t:any)=><div key={t.id} className="p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer"><p className="font-medium text-sm">{t.subject||'No subject'} <Badge tone="green">REPLIED</Badge></p><p className="text-sm text-zinc-500 truncate">{t.snippet||''}</p></div>)}</div>}
        <form action="/api/emails/sync" method="POST" className="mt-3"><button className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg text-sm">Sync Gmail now</button></form>
      </Card>
      <Card className="md:col-span-2"><h3 className="font-semibold">Thread + Composer + AI reply suggestion</h3><p className="text-sm text-zinc-500 mt-1">Lead info + email conversation + CRM timeline — AI suggests reply (user approves before send)</p>
        <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-600">Select a conversation or send a new email — Gmail OAuth required. Composer below works in queued mode without Gmail, and real send when Gmail connected.</div>
        <div className="mt-4"><Composer to="client@example.com" lead={{ business_name:'ABC Dental', city:'Miami' }} /></div>
      </Card>
    </div>
  </AppShell>
}
