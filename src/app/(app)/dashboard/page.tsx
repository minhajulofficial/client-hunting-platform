import { AppShell } from '@/components/layout/AppShell'
import { StatCard, Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
export default function Dashboard(){
  const stats = [
    {label:'Total Leads', value:'1,247'},
    {label:'Verified', value:'892', sub:'71% verified'},
    {label:'Contacted', value:'342'},
    {label:'Replied', value:'89', sub:'26% reply rate'},
    {label:'Interested', value:'31'},
    {label:'Won', value:'12'},
  ]
  return <AppShell>
    <h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-zinc-500">Overview of your client hunting workspace</p>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">{stats.map(s=><StatCard key={s.label} {...s}/>)}</div>
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      <Card className="md:col-span-2"><h3 className="font-semibold">Leads collected over time</h3><div className="h-40 flex items-end gap-1 mt-4">{[20,35,45,30,60,55,80].map((h,i)=><div key={i} style={{height:h*2}} className="flex-1 bg-zinc-900 rounded-t dark:bg-white"/>)} </div><p className="text-xs text-zinc-500 mt-2">Last 7 days</p></Card>
      <Card><h3 className="font-semibold">Recent activity</h3><ul className="mt-4 space-y-3 text-sm">
        <li className="flex justify-between"><span><Badge tone="blue">Lead Imported</Badge> ABC Dental</span><span className="text-zinc-500">10:25 AM</span></li>
        <li className="flex justify-between"><span><Badge tone="green">Email Sent</Badge> XYZ Dental</span><span className="text-zinc-500">11:05 AM</span></li>
        <li className="flex justify-between"><span><Badge tone="yellow">Reply Received</Badge> John Smith</span><span className="text-zinc-500">12:30 PM</span></li>
      </ul></Card>
    </div>
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card><h3 className="font-semibold">Pipeline</h3><div className="flex flex-wrap gap-2 mt-3">{['NEW 342','VERIFIED 210','CONTACTED 89','REPLIED 31','MEETING 12','WON 8'].map(s=><Badge key={s}>{s}</Badge>)}</div></Card>
      <Card><h3 className="font-semibold">Follow-ups Due</h3><p className="text-3xl font-bold mt-2">7</p><p className="text-sm text-zinc-500">3 overdue • 4 today</p></Card>
    </div>
  </AppShell>
}
