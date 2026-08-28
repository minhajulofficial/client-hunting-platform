'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['NEW','REVIEW','VERIFIED','CONTACTED','REPLIED','INTERESTED','NOT_INTERESTED','FOLLOW_UP','MEETING','PROPOSAL','WON','LOST','INVALID','UNSUBSCRIBED'] as const

export function LeadStatusControl({ leadId, current }: { leadId:string; current:string }){
  const router = useRouter()
  const [value,setValue]=useState(current)
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')
  const [error,setError]=useState('')

  async function save(next:string){
    setSaving(true); setMsg(''); setError('')
    try{
      const r=await fetch('/api/leads/'+leadId,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: next })})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Update failed')
      setValue(next); setMsg('Status updated ✓'); router.refresh()
    }catch(e){ setError(e instanceof Error? e.message:'Update failed') }
    setSaving(false)
  }

  return <div className="space-y-2">
    <select value={value} disabled={saving} onChange={e=>save(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white disabled:opacity-50">
      {STATUSES.map(s=> <option key={s} value={s}>{s}</option>)}
    </select>
    {saving && <p className="text-xs text-zinc-500">Saving…</p>}
    {msg && <p className="text-xs text-green-700">{msg}</p>}
    {error && <p className="text-xs text-red-600">{error}</p>}
    <p className="text-xs text-zinc-500">Every change is written to <code className="bg-zinc-100 px-1 rounded">activity_logs</code>.</p>
  </div>
}
