'use client'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
export function VerificationBadge({ lead }: { lead:any }){
  const [res,setRes]=useState<any>(null)
  const [loading,setLoading]=useState(false)
  async function verify(){
    setLoading(true)
    const r=await fetch('/api/leads/verify',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: lead.email, phone: lead.phone })})
    const j=await r.json(); setRes(j.data); setLoading(false)
  }
  const score = (lead.email_status==='VERIFIED'?30:0)+(lead.phone_status==='VALID'?20:0)+(lead.website?20:0)+(lead.lead_score||0)
  return <div className="space-y-2">
    <div className="flex gap-2 flex-wrap">
      <Badge tone={lead.email_status==='VERIFIED'?'green':lead.email_status==='INVALID'?'red':'yellow'}>Email: {lead.email_status||'UNKNOWN'}</Badge>
      <Badge tone={lead.phone_status==='VALID'?'green':'yellow'}>Phone: {lead.phone_status||'UNKNOWN'}</Badge>
      <Badge tone={lead.facebook||lead.instagram?'green':'yellow'}>Social: {lead.facebook||lead.instagram?'FOUND':'NOT_FOUND'}</Badge>
      <Badge tone="blue">Score: {Math.min(100,score)}/100</Badge>
    </div>
    <button onClick={verify} disabled={loading} className="px-3 py-1.5 border border-zinc-200 bg-white rounded-lg text-xs hover:bg-zinc-50">{loading?'Verifying...':'Re-verify (syntax → domain → MX → business domain)'}</button>
    {res && <pre className="bg-zinc-50 p-3 rounded border text-xs overflow-auto">{JSON.stringify(res,null,2)}</pre>}
    <p className="text-xs text-zinc-500">Confidence: not 100% real — syntax/DNS/MX/business-domain + phone format + social URL check.</p>
  </div>
}
