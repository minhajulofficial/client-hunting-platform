import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProjectForm } from '@/components/projects/ProjectForm'
export default async function Projects(){
  const supabase=await createClient()
  const { data: projects } = await supabase.from('projects').select('*').order('created_at',{ascending:false}).limit(20)
  const list = projects && projects.length ? projects : [{id:'demo', name:'USA Dental Outreach (demo)', country:'USA', niche:'Dental Clinic', status:'active', created_at: new Date().toISOString()}]
  const { data: leadCounts } = await supabase.from('leads').select('project_id').limit(500)
  return <AppShell>
    <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Projects</h1><Badge>Pipeline: NEW → WON/LOST</Badge></div>
    <p className="text-sm text-zinc-500 mt-1">Each lead belongs to a project. Target 500 leads etc.</p>
    <div className="grid lg:grid-cols-3 gap-6 mt-6">
      <div className="lg:col-span-2 grid md:grid-cols-2 gap-4 content-start">{list.map((p:any)=><Link key={p.id} href={`/projects/${p.id}`}><Card><div className="flex justify-between"><h3 className="font-semibold">{p.name}</h3><Badge tone="green">{p.status}</Badge></div><p className="text-sm text-zinc-500 mt-1">{p.country||'—'} • {p.niche||'—'}</p><p className="text-xs text-zinc-500 mt-2">Leads: {leadCounts?.filter((l:any)=>l.project_id===p.id).length||0} • {new Date(p.created_at).toLocaleDateString()}</p></Card></Link>)}</div>
      <ProjectForm />
    </div>
  </AppShell>
}
