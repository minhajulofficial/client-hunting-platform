'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function GmailSyncButton(){
  const router=useRouter()
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState('')
  const [error,setError]=useState('')

  async function sync(){
    setLoading(true); setMsg(''); setError('')
    try{
      const r=await fetch('/api/emails/sync',{ method:'POST' })
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Sync failed')
      setMsg(`Synced ${j.data.synced} message(s) from ${j.data.total} checked`)
      router.refresh()
    }catch(e){ setError(e instanceof Error? e.message:'Sync failed') }
    setLoading(false)
  }

  return <div className="text-right">
    <button onClick={sync} disabled={loading} className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm disabled:opacity-50">{loading?'Syncing…':'Sync Gmail'}</button>
    {msg && <p className="text-xs text-green-700 mt-1">{msg}</p>}
    {error && <p className="text-xs text-red-600 mt-1 max-w-xs">{error}</p>}
  </div>
}
