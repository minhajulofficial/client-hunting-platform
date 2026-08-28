import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
export default function Leads(){
  const leads=[{name:'ABC Dental', city:'Miami', niche:'Dental', email:'info@abcdental.com', status:'VERIFIED'},{name:'Bright Smile', city:'Tampa', niche:'Dental', email:'contact@brightsmile.com', status:'NEW'}]
  return <AppShell>
    <div className="flex flex-wrap gap-2 items-center justify-between"><h1 className="text-2xl font-bold">Leads</h1><div className="flex gap-2"><button className="px-3 py-2 border rounded-lg text-sm">Import CSV</button><button className="px-3 py-2 border rounded-lg text-sm">Export</button><button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">Add Lead</button></div></div>
    <Card className="mt-4"><div className="flex flex-wrap gap-2 mb-4">{['Country','City','Niche','Position','Email Verified','Has Website','Instagram','Status','Project','Tags'].map(f=><span key={f} className="px-3 py-1.5 border rounded-full text-xs">{f}</span>)}</div>
      <div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="text-zinc-500 border-b"><th className="text-left p-2">Business</th><th className="text-left p-2">Person / Position</th><th className="text-left p-2">Email</th><th className="text-left p-2">Phone</th><th className="text-left p-2">Website</th><th className="text-left p-2">Social</th><th className="text-left p-2">Status</th></tr></thead><tbody>{leads.map(l=><tr key={l.name} className="border-b last:border-0"><td className="p-2 font-medium">{l.name}<span className="text-zinc-500 font-normal"> • {l.city}</span></td><td className="p-2">Owner</td><td className="p-2">{l.email}</td><td className="p-2">+1 305...</td><td className="p-2">website</td><td className="p-2">IG FB</td><td className="p-2"><Badge tone={l.status==='VERIFIED'?'green':'yellow'}>{l.status}</Badge></td></tr>)}</tbody></table></div>
      <p className="text-xs text-zinc-500 mt-3">Deduplication: Email • Phone • Website domain • Business name • Address • Source ID. Possible duplicates require confirmation.</p>
    </Card>
  </AppShell>
}
