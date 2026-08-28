'use client'
import { useEffect, useState } from 'react'

interface Campaign { id:string; name:string }

export function BulkActions({ selected, onDone }: { selected:string[]; onDone?: ()=>void }){
  const [campaigns,setCampaigns]=useState<Campaign[]>([])
  const [campaignId,setCampaignId]=useState('')
  const [busy,setBusy]=useState(false)
  const [msg,setMsg]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{
    fetch('/api/campaigns').then(r=>r.json()).then(j=>{ if(j.success) setCampaigns(j.data||[]) }).catch(()=>{})
  },[])

  async function add(){
    if(!campaignId){ setError('Choose a campaign'); return }
    if(selected.length===0){ setError('Select at least one lead'); return }
    setBusy(true); setError(''); setMsg('')
    try{
      const r=await fetch('/api/campaigns/recipients',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ campaign_id: campaignId, lead_ids: selected })})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Failed to add recipients')
      setMsg(`Added ${j.data.added} · skipped ${j.data.skipped_no_email} without email, ${j.data.skipped_blocked} blocked, ${j.data.skipped_already_added} already added`)
      onDone?.()
    }catch(e){ setError(e instanceof Error? e.message:'Failed') }
    setBusy(false)
  }

  return <div className="space-y-2">
    <div className="flex gap-2 flex-wrap items-center">
      <select value={campaignId} onChange={e=>setCampaignId(e.target.value)} className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-white">
        <option value="">{campaigns.length? 'Add selected to campaign…' : 'No campaigns — create one first'}</option>
        {campaigns.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button onClick={add} disabled={busy || selected.length===0} className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs disabled:opacity-50">{busy?'Adding…':`Add ${selected.length} lead(s)`}</button>
    </div>
    {msg && <p className="text-xs text-green-700">{msg}</p>}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
}
