import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Timeline } from '@/components/leads/Timeline'
import { createClient } from '@/lib/supabase/server'
export default async function LeadDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const supabase=await createClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id',id).single()
  const { data: logs } = await supabase.from('activity_logs').select('*').eq('entity_id',id).order('created_at',{ascending:true}).limit(20)
  const l=lead||{ id, business_name:'Lead '+id.slice(0,6), city:'Miami', country:'USA', status:'NEW', email_status:'UNKNOWN' }
  const events=(logs||[]).map((r:any)=>({date:new Date(r.created_at).toLocaleString(), text: r.action+' '+ (r.details?JSON.stringify(r.details).slice(0,80):'') }))
  const fallback=[{date:'26 Aug 2026', text:'Lead imported'},{date:'26 Aug 2026', text:'Email verified '+ (l.email_status||'')},{date:'27 Aug 2026', text:'Status '+l.status}]
  return <AppShell><h1 className="text-2xl font-bold">{l.business_name}</h1><p className="text-sm text-zinc-500">ID: {id} • {l.city} {l.country}</p>
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      <Card className="md:col-span-2">
        <h3 className="font-semibold">Business & Contact</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-zinc-500">Email</span><p>{l.email||'-'} <Badge tone={l.email_status==='VERIFIED'?'green':'yellow'}>{l.email_status}</Badge></p></div>
          <div><span className="text-zinc-500">Phone</span><p>{l.phone||'-'}</p></div>
          <div><span className="text-zinc-500">Website</span><p className="truncate">{l.website||'-'}</p></div>
          <div><span className="text-zinc-500">Social</span><p>{[l.facebook,l.instagram,l.linkedin].filter(Boolean).join(' • ')||'-'}</p></div>
        </div>
        <div className="flex gap-2 mt-4"><Badge>{l.status}</Badge><Badge tone="green">{l.email_status}</Badge></div>
      </Card>
      <Card><h3 className="font-semibold">Timeline</h3><Timeline events={events.length?events:fallback} /></Card>
    </div>
  </AppShell>
}
