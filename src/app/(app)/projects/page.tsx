import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { ProjectForm } from '@/components/projects/ProjectForm'
export default async function Projects(){
  const configured = isSupabaseConfigured()
  let projects:any[]=[]
  let errorMsg=''
  if(configured){
    try{
      const supabase=await createClient()
      if(supabase){
        const { data, error } = await supabase.from('projects').select('*').order('created_at',{ascending:false}).limit(20)
        if(error) errorMsg=error.message
        else projects=data||[]
      }
    }catch(e:any){ errorMsg=e.message }
  }
  let leadCounts:any[]=[]
  if(configured && projects.length){
    try{
      const supabase=await createClient()
      if(supabase){
        const { data } = await supabase.from('leads').select('project_id').limit(500)
        leadCounts=data||[]
      }
    }catch{}
  }
  return <AppShell>
    {!configured && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-semibold text-amber-900">Setup Required</h3><p className="text-sm text-amber-800">Supabase not configured — projects will not persist. Add env vars to Vercel.</p></div>}
    {errorMsg && <p className="text-sm text-red-600 mb-3">Error: {errorMsg}</p>}
    <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Projects</h1><Badge>Pipeline: NEW → WON/LOST</Badge></div>
    <p className="text-sm text-zinc-500 mt-1">Each lead belongs to a project. Target 500 leads etc.</p>
    <div className="grid lg:grid-cols-3 gap-6 mt-6">
      <div className="lg:col-span-2">
        {projects.length===0 ? <Card><p className="text-sm text-zinc-500 text-center py-8">No projects yet — create one on the right. Then extension can import leads into it.</p></Card>
        : <div className="grid md:grid-cols-2 gap-4">{projects.map((p:any)=><Link key={p.id} href={`/projects/${p.id}`}><Card><div className="flex justify-between"><h3 className="font-semibold">{p.name}</h3><Badge tone="green">{p.status}</Badge></div><p className="text-sm text-zinc-500 mt-1">{p.country||'—'} • {p.niche||'—'}</p><p className="text-xs text-zinc-500 mt-2">Leads: {leadCounts.filter((l:any)=>l.project_id===p.id).length||0} • {new Date(p.created_at).toLocaleDateString()}</p></Card></Link>)}</div>}
      </div>
      <ProjectForm />
    </div>
  </AppShell>
}
