import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
export default async function Projects(){
  const supabase=await createClient()
  const { data: projects } = await supabase.from('projects').select('*').order('created_at',{ascending:false}).limit(20)
  const list = projects && projects.length ? projects : [{id:'demo', name:'USA Dental Outreach (demo)', country:'USA', niche:'Dental Clinic', status:'active'}]
  return <AppShell>
    <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Projects</h1><Link href="/projects" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">New Project</Link></div>
    <p className="text-sm text-zinc-500 mt-1">Each lead belongs to a project • Pipeline: NEW → VERIFIED → CONTACTED → REPLIED → INTERESTED → MEETING → PROPOSAL → WON/LOST</p>
    <div className="grid md:grid-cols-2 gap-4 mt-6">{list.map((p:any)=><Link key={p.id} href={`/projects/${p.id}`}><Card><div className="flex justify-between"><h3 className="font-semibold">{p.name}</h3><Badge tone="green">{p.status}</Badge></div><p className="text-sm text-zinc-500 mt-1">{p.country||'—'} • {p.niche||'—'}</p><p className="text-xs text-zinc-500 mt-2">{new Date(p.created_at||Date.now()).toLocaleDateString()}</p></Card></Link>)}</div>
  </AppShell>
}
