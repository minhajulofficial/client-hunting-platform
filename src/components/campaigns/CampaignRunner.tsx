'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorState } from '@/components/ui/states'

export function CampaignRunner({ campaignId, queued }: { campaignId:string; queued:number }){
  const router=useRouter()
  const [running,setRunning]=useState(false)
  const [result,setResult]=useState<string>('')
  const [error,setError]=useState('')

  async function start(){
    if(queued===0){ setError('There are no QUEUED recipients. Add recipients from the Leads page first.'); return }
    if(!confirm(`Send ${queued} queued email(s) now? Only VERIFIED/RISKY addresses are used.`)) return
    setRunning(true); setError(''); setResult('')
    try{
      const r=await fetch('/api/campaigns/send',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ campaignId })})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Send failed')
      setResult(`Sent ${j.data.sent}, failed ${j.data.failed}, of ${j.data.total} processed`)
      router.refresh()
    }catch(e){ setError(e instanceof Error? e.message:'Send failed') }
    setRunning(false)
  }

  return <div className="space-y-2">
    <button onClick={start} disabled={running} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{running?'Sending…':'Start Queue'}</button>
    {result && <p className="text-sm text-green-700">{result}</p>}
    {error && <ErrorState message={error} />}
  </div>
}
