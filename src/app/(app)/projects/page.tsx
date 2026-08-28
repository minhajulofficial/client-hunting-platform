import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
export default function Projects(){
  const projects=[{id:'1', name:'USA Dental Outreach', country:'USA', niche:'Dental Clinic', progress:'342/500', status:'active'},{id:'2', name:'Miami Restaurants', country:'USA', niche:'Restaurant', progress:'89/200', status:'active'}]
  return <AppShell>
    <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Projects</h1><button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">New Project</button></div>
    <div className="grid md:grid-cols-2 gap-4 mt-6">{projects.map(p=><Link key={p.id} href={`/projects/${p.id}`}><Card><div className="flex justify-between"><h3 className="font-semibold">{p.name}</h3><Badge tone="green">{p.status}</Badge></div><p className="text-sm text-zinc-500 mt-1">{p.country} • {p.niche}</p><p className="text-sm mt-3">Target: {p.progress} leads</p></Card></Link>)}</div>
  </AppShell>
}
