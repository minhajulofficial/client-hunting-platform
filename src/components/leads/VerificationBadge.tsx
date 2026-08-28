'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface LeadLike { id?:string; email?:string|null; phone?:string|null; country?:string|null; email_status?:string|null; phone_status?:string|null; facebook?:string|null; instagram?:string|null; linkedin?:string|null; lead_score?:number|null }

export function VerificationBadge({ lead }: { lead: LeadLike }){
  const router = useRouter()
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState('')
  const [error,setError]=useState('')

  const hasSocial = !!(lead.facebook || lead.instagram || lead.linkedin)

  async function verify(){
    if(!lead.email && !lead.phone){ setError('This lead has no email or phone to verify'); return }
    setLoading(true); setError(''); setMsg('')
    try{
      const r=await fetch('/api/leads/verify',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: lead.email, phone: lead.phone, leadId: lead.id, country: lead.country })})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Verification failed')
      const parts:string[]=[]
      if(j.data.email) parts.push('email '+j.data.email.status)
      if(j.data.phone) parts.push('phone '+j.data.phone.status)
      setMsg(parts.join(' · ')+(j.data.saved? ' · saved ✓':''))
      router.refresh()
    }catch(e){ setError(e instanceof Error? e.message:'Verification failed') }
    setLoading(false)
  }

  return <div className="space-y-2">
    <div className="flex gap-2 flex-wrap">
      <Badge tone={lead.email_status==='VERIFIED'?'green':lead.email_status==='INVALID'?'red':'yellow'}>Email: {lead.email_status || 'UNKNOWN'}</Badge>
      <Badge tone={lead.phone_status==='VALID'?'green':lead.phone_status==='INVALID'?'red':'yellow'}>Phone: {lead.phone_status || 'UNKNOWN'}</Badge>
      <Badge tone={hasSocial?'green':'default'}>Social: {hasSocial?'FOUND':'NOT_FOUND'}</Badge>
      <Badge tone="blue">Score: {lead.lead_score ?? 0}/100</Badge>
    </div>
    <button onClick={verify} disabled={loading} className="px-3 py-1.5 border border-zinc-200 bg-white rounded-lg text-xs disabled:opacity-50">{loading?'Verifying…':'Re-verify email & phone'}</button>
    {msg && <p className="text-xs text-green-700">{msg}</p>}
    {error && <p className="text-xs text-red-600">{error}</p>}
    <p className="text-xs text-zinc-500">Checks: syntax → domain → disposable → business domain. Confidence only — never a claim of 100% accuracy.</p>
  </div>
}
