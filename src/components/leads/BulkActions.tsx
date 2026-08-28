'use client'
import { useState } from 'react'
export function BulkActions({ selected, onAction }: { selected: string[]; onAction: ()=>void }){
  const [loading,setLoading]=useState(false)
  async function createCampaign(){
    if(!selected.length) return alert('Select leads first')
    const name=prompt('Campaign name','Outreach '+new Date().toLocaleDateString())
    if(!name) return
    setLoading(true)
    const r=await fetch('/api/campaigns',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, status:'draft' })})
    const j=await r.json()
    if(j.success && j.data?.id){
      // add recipients
      for(const leadId of selected){
        await fetch('/api/campaigns/recipients',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ campaign_id: j.data.id, lead_id: leadId })})
      }
      alert('Campaign '+name+' created with '+selected.length+' recipients')
      onAction()
    } else alert('Error: '+(j.error||'failed'))
    setLoading(false)
  }
  return <div className="flex gap-2">
    <button onClick={createCampaign} disabled={loading||!selected.length} className="px-3 py-1.5 bg-zinc-900 text-white rounded-full text-xs disabled:opacity-50">{loading?'...':'Create campaign ('+selected.length+')'}</button>
    <button onClick={()=> alert('Export '+selected.length+' leads — use CsvExport for filtered list')} className="px-3 py-1.5 border border-zinc-200 bg-white rounded-full text-xs">Export selected</button>
  </div>
}
