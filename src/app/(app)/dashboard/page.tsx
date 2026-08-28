import { AppShell } from '@/components/layout/AppShell'
import { StatCard, Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SetupRequired, EmptyState } from '@/components/ui/states'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface LeadRow { id:string; business_name:string; status:string; email_status?:string|null; created_at:string; lead_score?:number|null }
interface LogRow { id:string; action:string; created_at:string; entity_type?:string|null }

export default async function Dashboard(){
  if(!isSupabaseConfigured()){
    return <AppShell><h1 className="text-2xl font-bold">Dashboard</h1><div className="mt-6"><SetupRequired what="Database" vars={['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY']} /></div></AppShell>
  }

  const supabase = await createClient()
  const { data: leadData, error } = await supabase.from('leads').select('id,business_name,status,email_status,created_at,lead_score').order('created_at',{ ascending:false }).limit(1000)
  const { data: logData } = await supabase.from('activity_logs').select('id,action,created_at,entity_type').order('created_at',{ ascending:false }).limit(8)

  const leads = (leadData || []) as LeadRow[]
  const logs = (logData || []) as LogRow[]

  const has = (s:string[]) => leads.filter(l=> s.includes(l.status)).length
  const total = leads.length
  const verified = leads.filter(l=> l.email_status==='VERIFIED').length
  const contacted = has(['CONTACTED','REPLIED','INTERESTED','MEETING','PROPOSAL','WON'])
  const replied = has(['REPLIED','INTERESTED','MEETING','PROPOSAL','WON'])
  const won = has(['WON'])
  const followUps = has(['FOLLOW_UP'])

  // Real 7-day series computed from created_at
  const days: { label:string; count:number }[] = []
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-i)
    const next=new Date(d); next.setDate(next.getDate()+1)
    days.push({
      label: d.toLocaleDateString(undefined,{ weekday:'short' }),
      count: leads.filter(l=>{ const t=new Date(l.created_at).getTime(); return t>=d.getTime() && t<next.getTime() }).length
    })
  }
  const max = Math.max(1, ...days.map(d=>d.count))

  const pipeline = ['NEW','REVIEW','VERIFIED','CONTACTED','REPLIED','INTERESTED','MEETING','PROPOSAL','WON','LOST']

  return <AppShell>
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <p className="text-sm text-zinc-500 mt-1">Live figures from your database — no sample data.</p>

    {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Failed to load leads: {error.message}</div>}

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
      <StatCard label="Total leads" value={total} />
      <StatCard label="Verified" value={verified} sub={total? Math.round(verified/total*100)+'% of leads' : undefined} />
      <StatCard label="Contacted" value={contacted} />
      <StatCard label="Replied" value={replied} sub={contacted? Math.round(replied/contacted*100)+'% reply rate' : undefined} />
      <StatCard label="Won" value={won} />
      <StatCard label="Follow-ups due" value={followUps} />
    </div>

    {total===0
      ? <div className="mt-6"><EmptyState title="No leads yet" description="Create a project, then use the Chrome Extension on a business website to collect real leads, or import a CSV from the Leads page." action={<div className="flex gap-2"><a href="/projects" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">Create Project</a><a href="/leads" className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm">Import CSV</a></div>} /></div>
      : <div className="grid md:grid-cols-3 gap-6 mt-6">
          <Card className="md:col-span-2">
            <h3 className="font-semibold">Leads collected — last 7 days</h3>
            <div className="h-40 flex items-end gap-2 mt-4">{days.map((d,i)=>
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-zinc-500">{d.count}</span>
                <div style={{ height: Math.round(d.count/max*110)+2 }} className="w-full bg-zinc-900 rounded-t" />
                <span className="text-xs text-zinc-500">{d.label}</span>
              </div>)}
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold">Recent activity</h3>
            {logs.length===0
              ? <p className="text-sm text-zinc-500 mt-3">No activity recorded yet.</p>
              : <ul className="mt-3 space-y-2 text-sm">{logs.map(l=>
                  <li key={l.id} className="flex justify-between gap-2"><span className="truncate">{l.action.replace(/_/g,' ')}</span><span className="text-xs text-zinc-500 shrink-0">{new Date(l.created_at).toLocaleTimeString()}</span></li>)}
                </ul>}
          </Card>
        </div>}

    {total>0 && <Card className="mt-6">
      <h3 className="font-semibold">Pipeline</h3>
      <div className="flex flex-wrap gap-2 mt-3">{pipeline.map(s=>{
        const n = leads.filter(l=>l.status===s).length
        return <Badge key={s} tone={n>0?'blue':'default'}>{s} {n}</Badge>
      })}</div>
    </Card>}
  </AppShell>
}
