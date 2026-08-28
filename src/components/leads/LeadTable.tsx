'use client'
import { Badge } from '@/components/ui/badge'
export function LeadTable({ leads }: { leads: any[] }){
  if(!leads.length) return <p className="text-sm text-zinc-500 py-8 text-center">No leads — import via extension or CSV</p>
  return <div className="overflow-auto"><table className="w-full text-sm">
    <thead><tr className="text-zinc-500 border-b"><th className="text-left p-2">Business</th><th className="text-left p-2">Contact</th><th className="text-left p-2">Email</th><th className="text-left p-2">Phone</th><th className="text-left p-2">Website</th><th className="text-left p-2">Status</th></tr></thead>
    <tbody>{leads.map((l:any)=><tr key={l.id} className="border-b last:border-0 hover:bg-zinc-50"><td className="p-2 font-medium">{l.business_name}<span className="text-zinc-500 font-normal"> • {l.city||''} {l.country||''}</span><div className="text-xs text-zinc-500">{l.niche||''} • {l.source||''}</div></td><td className="p-2">{l.contact_first_name||''} {l.contact_last_name||''}<div className="text-xs text-zinc-500">{l.contact_position||'Owner'}</div></td><td className="p-2">{l.email}<div className="text-xs"><Badge tone={l.email_status==='VERIFIED'?'green':l.email_status==='INVALID'?'red':'yellow'}>{l.email_status||'UNKNOWN'}</Badge></div></td><td className="p-2">{l.phone||'-'}</td><td className="p-2 truncate max-w-[150px]">{l.website||'-'}</td><td className="p-2"><Badge tone={l.status==='REPLIED'?'green':l.status==='NEW'?'yellow':'default'}>{l.status}</Badge></td></tr>)}</tbody>
  </table></div>
}
