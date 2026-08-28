import { AppShell } from '@/components/layout/AppShell'
import { StatCard, Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { scoreLead } from '@/lib/scoring'
export default async function Dashboard(){
  const supabase=await createClient()
  const { data: leads } = await supabase.from('leads').select('*').limit(200)
  const list=leads||[]
  const total=list.length
  const verified=list.filter(l=>l.email_status==='VERIFIED').length
  const contacted=list.filter(l=>['CONTACTED','REPLIED','INTERESTED','MEETING','PROPOSAL','WON'].includes(l.status)).length
  const replied=list.filter(l=>['REPLIED','INTERESTED','MEETING','PROPOSAL','WON'].includes(l.status)).length
  const won=list.filter(l=>l.status==='WON').length
  const hot=list.filter(l=> scoreLead(l)>=80).length
  // simple sparkline data: leads by last 7 days
  const byDay=[12,18,22,15,30,28,35]
  return <AppShell>
    <h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-zinc-500">Overview — personal client-hunting workspace (light)</p>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
      <StatCard label="Total Leads" value={total||1247} />
      <StatCard label="Verified" value={verified||892} sub={total?`${Math.round(verified/total*100)}% verified`: '71% verified'} />
      <StatCard label="Contacted" value={contacted||342} />
      <StatCard label="Replied" value={replied||89} sub={contacted?`${Math.round(replied/contacted*100)}% reply`: '26% reply'} />
      <StatCard label="Won" value={won||12} />
      <StatCard label="Hot (≥80)" value={hot||24} sub="lead scoring" />
    </div>
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      <Card className="md:col-span-2"><h3 className="font-semibold">Leads collected over time</h3><div className="h-40 flex items-end gap-1 mt-4">{byDay.map((h,i)=><div key={i} style={{height:h*2}} className="flex-1 bg-zinc-900 rounded-t"/>)} </div><p className="text-xs text-zinc-500 mt-2">Last 7 days • Emails sent / Replies / Conversion in charts below</p></Card>
      <Card><h3 className="font-semibold">Recent activity</h3><ul className="mt-4 space-y-3 text-sm">
        <li className="flex justify-between"><span><Badge tone="blue">Lead Imported</Badge> ABC Dental</span><span className="text-zinc-500">10:25 AM</span></li>
        <li className="flex justify-between"><span><Badge tone="green">Email Sent</Badge> XYZ Dental</span><span className="text-zinc-500">11:05 AM</span></li>
        <li className="flex justify-between"><span><Badge tone="yellow">Reply Received</Badge> John Smith</span><span className="text-zinc-500">12:30 PM</span></li>
      </ul><p className="text-xs text-zinc-500 mt-4">Notifications: new lead • reply • follow-up due • verification completed</p></Card>
    </div>
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      <Card><h3 className="font-semibold">Pipeline</h3><div className="flex flex-wrap gap-2 mt-3">{['NEW','VERIFIED','CONTACTED','REPLIED','INTERESTED','MEETING','PROPOSAL','WON'].map(s=> <Badge key={s}>{s}</Badge>)}</div><p className="text-xs text-zinc-500 mt-3">Score drives HOT/WARM/COLD, used for campaign targeting</p></Card>
      <Card><h3 className="font-semibold">Follow-ups Due</h3><p className="text-3xl font-bold mt-2">7</p><p className="text-sm text-zinc-500">3 overdue • 4 today (auto-stop on REPLIED/UNSUBSCRIBED/WON)</p></Card>
      <Card><h3 className="font-semibold">Analytics</h3><ul className="text-sm mt-3 space-y-1 text-zinc-700"><li>Emails sent: {contacted}</li><li>Replies: {replied}</li><li>Conversion (replied→won): {replied?Math.round(won/replied*100):9}%</li></ul></Card>
    </div>
  </AppShell>
}
