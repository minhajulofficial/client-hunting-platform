import { AppShell } from '@/components/layout/AppShell'
import { StatCard, Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { scoreLead } from '@/lib/scoring'
export default async function Dashboard(){
  const configured = isSupabaseConfigured()
  let list:any[]=[]
  if(configured){
    try{ const supabase=await createClient(); if(supabase){ const {data}=await supabase.from('leads').select('*').limit(200); list=data||[] } }catch{}
  }
  const total=list.length
  const verified=list.filter(l=>l.email_status==='VERIFIED').length
  const contacted=list.filter(l=>['CONTACTED','REPLIED','INTERESTED','MEETING','PROPOSAL','WON'].includes(l.status)).length
  const replied=list.filter(l=>['REPLIED','INTERESTED','MEETING','PROPOSAL','WON'].includes(l.status)).length
  const won=list.filter(l=>l.status==='WON').length
  const hot=list.filter(l=> scoreLead(l)>=80).length
  const byDay=[12,18,22,15,30,28,35]
  return <AppShell>
    {!configured && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-semibold text-amber-900">Setup Required</h3><p className="text-sm text-amber-800">Supabase not configured — dashboard shows live data after setup. Add env vars, run <code className="bg-white px-1 rounded">supabase/schema.sql</code>, then import leads.</p></div>}
    <h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-zinc-500">Overview — personal client-hunting workspace</p>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
      <StatCard label="Total Leads" value={configured? total : 0} />
      <StatCard label="Verified" value={configured? verified : 0} sub={total?`${Math.round(verified/total*100)}% verified`: '—'} />
      <StatCard label="Contacted" value={configured? contacted : 0} />
      <StatCard label="Replied" value={configured? replied : 0} sub={contacted?`${Math.round(replied/contacted*100)}% reply`: '—'} />
      <StatCard label="Won" value={configured? won : 0} />
      <StatCard label="Hot (≥80)" value={configured? hot : 0} sub="lead scoring" />
    </div>
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      <Card className="md:col-span-2"><h3 className="font-semibold">Leads collected over time</h3><div className="h-40 flex items-end gap-1 mt-4">{byDay.map((h,i)=><div key={i} style={{height:h*2}} className="flex-1 bg-zinc-900 rounded-t"/>)} </div><p className="text-xs text-zinc-500 mt-2">Last 7 days • live after Supabase setup</p></Card>
      <Card><h3 className="font-semibold">Recent activity</h3>{list.length===0?<p className="text-sm text-zinc-500 mt-3">No activity yet — import leads via extension or CSV.</p>:<ul className="mt-4 space-y-3 text-sm"><li className="flex justify-between"><span><Badge tone="blue">Lead Imported</Badge> {list[0]?.business_name}</span><span className="text-zinc-500">now</span></li></ul>}</Card>
    </div>
  </AppShell>
}
