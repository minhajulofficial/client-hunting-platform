'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { BulkActions } from '@/components/leads/BulkActions'
import { EmptyState } from '@/components/ui/states'

export interface LeadRow {
  id:string; business_name:string; city?:string|null; country?:string|null; niche?:string|null;
  contact_first_name?:string|null; contact_last_name?:string|null; contact_position?:string|null;
  email?:string|null; email_status?:string|null; phone?:string|null; website?:string|null;
  facebook?:string|null; instagram?:string|null; status:string; lead_score?:number|null; source?:string|null;
}

export function LeadWorkspace({ leads }: { leads: LeadRow[] }){
  const [selected,setSelected]=useState<string[]>([])
  const allSelected = leads.length>0 && selected.length===leads.length

  function toggle(id:string){ setSelected(s=> s.includes(id)? s.filter(x=>x!==id) : [...s,id]) }
  function toggleAll(){ setSelected(allSelected? [] : leads.map(l=>l.id)) }

  function exportCsv(){
    const rows = selected.length? leads.filter(l=>selected.includes(l.id)) : leads
    if(rows.length===0) return
    const cols = ['business_name','contact_first_name','contact_last_name','contact_position','email','email_status','phone','website','facebook','instagram','city','country','niche','status','lead_score','source']
    const csv = [cols.join(',')].concat(rows.map(r=> cols.map(c=>{
      const v = (r as unknown as Record<string, unknown>)[c]
      return '"'+String(v ?? '').replace(/"/g,'""')+'"'
    }).join(','))).join('\n')
    const url = URL.createObjectURL(new Blob([csv],{ type:'text/csv' }))
    const a = document.createElement('a'); a.href=url; a.download='leads.csv'; a.click(); URL.revokeObjectURL(url)
  }

  if(leads.length===0){
    return <EmptyState
      title="No leads yet"
      description="Create a project, then open a business website and use the Chrome Extension (START HUNT → Import Selected). You can also import a CSV below."
      action={<Link href="/projects" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">Create a project</Link>} />
  }

  return <div className="space-y-3">
    <div className="flex flex-wrap gap-3 items-center justify-between">
      <BulkActions selected={selected} onDone={()=>setSelected([])} />
      <button onClick={exportCsv} className="px-3 py-1.5 border border-zinc-200 bg-white rounded-lg text-xs">Export {selected.length? selected.length+' selected' : 'all shown'} (CSV)</button>
    </div>

    <div className="overflow-auto border border-zinc-200 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50"><tr className="text-zinc-500 border-b border-zinc-200">
          <th className="p-2 w-8"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
          <th className="text-left p-2">Business</th>
          <th className="text-left p-2">Contact</th>
          <th className="text-left p-2">Email</th>
          <th className="text-left p-2">Phone</th>
          <th className="text-left p-2">Score</th>
          <th className="text-left p-2">Status</th>
        </tr></thead>
        <tbody>{leads.map(l=>
          <tr key={l.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
            <td className="p-2"><input type="checkbox" checked={selected.includes(l.id)} onChange={()=>toggle(l.id)} aria-label={'Select '+l.business_name} /></td>
            <td className="p-2">
              <Link href={'/leads/'+l.id} className="font-medium underline">{l.business_name}</Link>
              <div className="text-xs text-zinc-500">{[l.city,l.country].filter(Boolean).join(', ')}{l.niche? ' · '+l.niche : ''}{l.source? ' · '+l.source : ''}</div>
            </td>
            <td className="p-2">{[l.contact_first_name,l.contact_last_name].filter(Boolean).join(' ') || '—'}<div className="text-xs text-zinc-500">{l.contact_position || ''}</div></td>
            <td className="p-2 break-all">{l.email || '—'}<div className="text-xs mt-0.5"><Badge tone={l.email_status==='VERIFIED'?'green':l.email_status==='INVALID'?'red':'yellow'}>{l.email_status || 'UNKNOWN'}</Badge></div></td>
            <td className="p-2">{l.phone || '—'}</td>
            <td className="p-2">{l.lead_score ?? 0}</td>
            <td className="p-2"><Badge tone={l.status==='WON'||l.status==='REPLIED'?'green':l.status==='LOST'||l.status==='INVALID'?'red':'yellow'}>{l.status}</Badge></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <p className="text-xs text-zinc-500">Duplicates are blocked on import by email, phone, website domain and business name. Name-only matches arrive as REVIEW.</p>
  </div>
}
