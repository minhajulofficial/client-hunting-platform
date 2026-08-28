import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SetupRequired, ErrorState } from '@/components/ui/states'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import Link from 'next/link'
import { ProjectKanban } from '@/components/projects/ProjectKanban'

const STATUSES = ['NEW','REVIEW','VERIFIED','CONTACTED','REPLIED','INTERESTED','FOLLOW_UP','MEETING','PROPOSAL','WON','LOST']

export default async function ProjectDetail({ params, searchParams }: { params: Promise<{id:string}>, searchParams: Promise<Record<string,string>> }){
  const { id } = await params
  const sp = await searchParams

  if(!isSupabaseConfigured()){
    return <AppShell><h1 className="text-2xl font-bold">Project</h1><div className="mt-6"><SetupRequired what="Database" vars={['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY']} /></div></AppShell>
  }

  const supabase = await createClient()

  const { data: project, error: projErr } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
  if(projErr || !project){
    return <AppShell><h1 className="text-2xl font-bold">Project</h1><div className="mt-6"><ErrorState message={projErr?.message || 'Project not found'} /></div></AppShell>
  }

  const { data: leads } = await supabase.from('leads').select('*').eq('project_id', id).order('created_at',{ ascending: false }).limit(200)
  const { data: campaigns } = await supabase.from('campaigns').select('*').eq('project_id', id).order('created_at',{ ascending: false }).limit(50)
  const { data: activities } = await supabase.from('activity_logs').select('*').eq('entity_id', id).order('created_at',{ ascending: false }).limit(50)

  const leadList = (leads || []) as Array<{ id:string; business_name:string; status:string; lead_score?:number|null; email?:string|null; city?:string|null; contact_first_name?:string|null }>
  const campaignList = (campaigns || []) as Array<{ id:string; name:string; status:string; created_at:string }>
  const activityList = (activities || []) as Array<{ id:string; action:string; details?:Record<string,unknown>|null; created_at:string }>

  // Group leads by status for Kanban
  const grouped: Record<string, typeof leadList> = {}
  for(const s of STATUSES) grouped[s] = []
  for(const l of leadList){
    const s = l.status || 'NEW'
    if(!grouped[s]) grouped[s] = []
    grouped[s].push(l)
  }

  const kanbanStatuses = STATUSES.filter(s => grouped[s].length > 0 || ['NEW','VERIFIED','CONTACTED','REPLIED','WON'].includes(s))

  return <AppShell>
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-sm text-zinc-500">{project.niche || 'All niches'} · {project.country || 'Global'} · {leadList.length} leads · {campaignList.length} campaigns</p>
      </div>
      <Link href="/projects" className="px-3 py-1.5 border border-zinc-200 bg-white rounded-lg text-xs">← All projects</Link>
    </div>

    {/* Kanban */}
    <div className="mt-6 overflow-x-auto">
      <div className="flex gap-3 pb-4" style={{ minWidth: kanbanStatuses.length * 220 }}>
        {kanbanStatuses.map(status => (
          <div key={status} className="w-52 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{status}</h3>
              <Badge tone={status==='WON'?'green':status==='LOST'?'red':'default'}>{grouped[status].length}</Badge>
            </div>
            <div className="space-y-2">
              {grouped[status].map(l => (
                <Link key={l.id} href={'/leads/'+l.id} className="block bg-white border border-zinc-200 rounded-lg p-3 hover:border-zinc-300 transition-colors">
                  <p className="text-sm font-medium truncate">{l.business_name}</p>
                  <p className="text-xs text-zinc-500">{l.contact_first_name || ''} {l.city ? '· '+l.city : ''}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-400">Score: {l.lead_score ?? 0}</span>
                    {l.email && <span className="text-xs text-green-600">✓ email</span>}
                  </div>
                </Link>
              ))}
              {grouped[status].length === 0 && <p className="text-xs text-zinc-400 italic">No leads</p>}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Campaigns */}
    <Card className="mt-6 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Campaigns</h2>
        <Link href="/campaigns" className="px-3 py-1.5 border border-zinc-200 bg-white rounded-lg text-xs">View all</Link>
      </div>
      {campaignList.length === 0 ? (
        <p className="text-sm text-zinc-500">No campaigns for this project yet.</p>
      ) : (
        <div className="space-y-2">
          {campaignList.map(c => (
            <div key={c.id} className="flex items-center justify-between border border-zinc-100 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-zinc-500">Created {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <Badge tone={c.status==='active'||c.status==='sending'?'green':c.status==='completed'?'blue':'yellow'}>{c.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>

    {/* Activity */}
    <Card className="mt-6 p-4">
      <h2 className="font-semibold mb-3">Activity</h2>
      {activityList.length === 0 ? (
        <p className="text-sm text-zinc-500">No activity recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {activityList.map(a => (
            <div key={a.id} className="flex items-start gap-3 text-sm border-b border-zinc-50 pb-2 last:border-0">
              <Badge tone="blue">{a.action}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500">{new Date(a.created_at).toLocaleString()}</p>
                {a.details && <pre className="text-xs text-zinc-400 mt-0.5 overflow-hidden">{JSON.stringify(a.details)}</pre>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  </AppShell>
}
