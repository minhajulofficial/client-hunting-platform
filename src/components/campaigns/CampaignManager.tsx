'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/states'

interface Campaign { id:string; name:string; status:string; created_at:string; project_id?:string|null }

export function CampaignManager(){
  const [items,setItems]=useState<Campaign[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [creating,setCreating]=useState(false)
  const [name,setName]=useState('')

  const load=useCallback(async()=>{
    setLoading(true); setError('')
    try{
      const r=await fetch('/api/campaigns')
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Failed to load campaigns')
      setItems(j.data||[])
    }catch(e){ setError(e instanceof Error? e.message : 'Failed to load') }
    setLoading(false)
  },[])

  useEffect(()=>{ load() },[load])

  async function create(e: React.FormEvent){
    e.preventDefault()
    if(name.trim().length<2) return setError('Campaign name must be at least 2 characters')
    setCreating(true); setError('')
    try{
      const r=await fetch('/api/campaigns',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: name.trim(), status:'draft' })})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Create failed')
      setName('')
      await load()
    }catch(e){ setError(e instanceof Error? e.message : 'Create failed') }
    setCreating(false)
  }

  return <div className="space-y-4">
    <Card>
      <h3 className="font-semibold text-sm">New campaign</h3>
      <form onSubmit={create} className="flex gap-2 mt-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Campaign name (e.g. Miami Dental Outreach)" className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
        <button disabled={creating} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{creating?'Creating…':'Create Campaign'}</button>
      </form>
      <p className="text-xs text-zinc-500 mt-2">Add recipients from the Leads page, then start the queue on the campaign page.</p>
    </Card>

    {error && <ErrorState message={error} />}

    {loading ? <Card><Spinner label="Loading campaigns…" /></Card>
      : items.length===0 ? <EmptyState title="No campaigns yet" description="Create a campaign above, then add verified leads as recipients and start the sending queue." />
      : <div className="grid md:grid-cols-2 gap-4">{items.map(c=>
          <Link key={c.id} href={`/campaigns/${c.id}`}><Card>
            <div className="flex justify-between items-start"><h3 className="font-semibold">{c.name}</h3><Badge tone={c.status==='sent'?'green':'yellow'}>{c.status}</Badge></div>
            <p className="text-xs text-zinc-500 mt-2">Created {new Date(c.created_at).toLocaleDateString()}</p>
          </Card></Link>)}
        </div>}
  </div>
}
