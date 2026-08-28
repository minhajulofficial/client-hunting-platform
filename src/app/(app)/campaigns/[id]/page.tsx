import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
export default async function CampaignDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const configured=isSupabaseConfigured()
  let list:any[]=[]
  if(configured){
    try{
      const supabase=await createClient()
      const { data } = await supabase.from('campaign_recipients').select('*').eq('campaign_id',id).limit(50)
      list=data||[]
    }catch{}
  }
  if(list.length===0) list=[{id:'1', recipient_email:'info@abcdental.com', status:'QUEUED'},{id:'2', recipient_email:'hello@miami.com', status:'SENT'}]
  const counts={ QUEUED: list.filter((r:any)=>r.status==='QUEUED').length, SENT: list.filter((r:any)=>r.status==='SENT').length, FAILED: list.filter((r:any)=>r.status==='FAILED').length }
  return <AppShell>
    {!configured && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm text-amber-800">Supabase not configured — showing demo queue.</p></div>}
    <h1 className="text-2xl font-bold">Campaign {id}</h1><p className="text-sm text-zinc-500">Queue: QUEUED → SENDING → SENT with rate-limit. Follow-ups Day 0 / Day 3 / Day 7. Auto-stop on REPLIED/UNSUBSCRIBED/WON.</p>
    <div className="grid md:grid-cols-3 gap-4 mt-6"><Card><p className="text-xs text-zinc-500">QUEUED</p><p className="text-2xl font-bold">{counts.QUEUED}</p></Card><Card><p className="text-xs text-zinc-500">SENT</p><p className="text-2xl font-bold">{counts.SENT}</p></Card><Card><p className="text-xs text-zinc-500">FAILED/BOUNCED</p><p className="text-2xl font-bold">{counts.FAILED}</p></Card></div>
    <Card className="mt-6">
      <div className="flex justify-between items-center"><h3 className="font-semibold">Recipients</h3><form action="/api/campaigns/send" method="POST"><input type="hidden" name="campaignId" value={id} /><button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">Start Queue</button></form></div>
      <p className="text-xs text-zinc-500 mt-1">Default sends only to VERIFIED. Stop if lead becomes UNSUBSCRIBED/NOT_INTERESTED/WON.</p>
      <div className="overflow-auto mt-4"><table className="w-full text-sm"><thead><tr className="text-zinc-500 border-b"><th className="text-left p-2">Email</th><th className="text-left p-2">Lead</th><th className="text-left p-2">Status</th></tr></thead><tbody>{list.map((r:any)=><tr key={r.id} className="border-b"><td className="p-2">{r.recipient_email}</td><td className="p-2 text-xs text-zinc-500">{r.lead_id||'-'}</td><td className="p-2"><Badge tone={r.status==='SENT'?'green':r.status==='QUEUED'?'yellow':'default'}>{r.status}</Badge></td></tr>)}</tbody></table></div>
    </Card>
    <Card className="mt-6"><h3 className="font-semibold">Follow-ups</h3><div className="flex gap-2 mt-3 text-sm"><span className="px-3 py-1 border border-zinc-200 bg-white rounded-full">Day 0: Initial</span><span className="px-3 py-1 border border-zinc-200 bg-white rounded-full">Day 3: Follow-up</span><span className="px-3 py-1 border border-zinc-200 bg-white rounded-full">Day 7: Second follow-up</span></div><p className="text-xs text-zinc-500 mt-2">If reply detected → STOP.</p></Card>
  </AppShell>
}
