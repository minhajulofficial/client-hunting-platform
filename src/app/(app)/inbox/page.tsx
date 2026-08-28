import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Composer } from '@/components/email/Composer'
import { createClient } from '@/lib/supabase/server'
export default async function Inbox(){
  const supabase=await createClient()
  const { data: threads } = await supabase.from('email_threads').select('*').order('updated_at',{ascending:false}).limit(10)
  const list=threads||[{id:'demo', subject:'Re: Quick idea for ABC Dental', snippet:'Hi, thanks for reaching out...', gmail_thread_id:'demo'}]
  return <AppShell><h1 className="text-2xl font-bold">Inbox</h1><p className="text-sm text-zinc-500">Gmail-synced conversations matched to leads via thread ID — reply updates lead to REPLIED</p>
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      <Card><h3 className="font-semibold">Conversations</h3>
        <div className="mt-3 space-y-2">{list.map((t:any)=><div key={t.id} className="p-3 border rounded-lg hover:bg-zinc-50 cursor-pointer"><p className="font-medium text-sm">{t.subject||'No subject'} <Badge tone="green">REPLIED</Badge></p><p className="text-sm text-zinc-500 truncate">{t.snippet||''}</p></div>)}</div>
        <form action="/api/emails/sync" method="POST" className="mt-3"><button className="w-full px-3 py-2 border rounded-lg text-sm">Sync Gmail now</button></form>
      </Card>
      <Card className="md:col-span-2"><h3 className="font-semibold">Thread + Composer + AI reply suggestion</h3><p className="text-sm text-zinc-500 mt-1">Lead info + email conversation + CRM timeline — AI suggests reply (user approves before send)</p>
        <div className="mt-4 p-3 bg-zinc-50 rounded-lg text-sm">Hi, thanks for reaching out. Tell me more about your pricing?</div>
        <div className="mt-4"><Composer to="client@example.com" lead={{ business_name:'ABC Dental', city:'Miami' }} /></div>
      </Card>
    </div>
  </AppShell>
}
