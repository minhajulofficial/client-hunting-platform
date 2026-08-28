'use client'
import { useState } from 'react'
export function Composer({ to, lead }: { to?: string; lead?: any }){
  const [subject,setSubject]=useState('Quick idea for {{business_name}}')
  const [body,setBody]=useState('Hi {{first_name}},\n\nI noticed {{business_name}} in {{city}}...')
  const [sending,setSending]=useState(false)
  const [msg,setMsg]=useState('')
  const [aiLoading,setAiLoading]=useState(false)
  async function send(){
    setSending(true); setMsg('')
    const res=await fetch('/api/emails/send',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to, subject, body, leadId: lead?.id })})
    const j=await res.json(); setMsg(j.success?'Queued ✓':'Error: '+(j.error||'failed')); setSending(false)
  }
  async function personalize(){
    setAiLoading(true)
    const res=await fetch('/api/ai/personalize',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ template: body, lead: lead||{ business_name: 'ABC Dental', city:'Miami' }})})
    const j=await res.json(); if(j.success) setBody(j.data.text); setAiLoading(false)
  }
  async function generate(){
    setAiLoading(true)
    const res=await fetch('/api/ai/generate',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: subject, variables:{ business_name: lead?.business_name||'ABC', city: lead?.city||'Miami' }})})
    const j=await res.json(); if(j.success) setBody(j.data.text); setAiLoading(false)
  }
  return <div className="border rounded-xl p-4 bg-white">
    <div className="grid gap-3">
      <input value={to||''} readOnly placeholder="To" className="px-3 py-2 border rounded-lg text-sm bg-zinc-50" />
      <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject" className="px-3 py-2 border rounded-lg text-sm" />
      <textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} className="px-3 py-2 border rounded-lg text-sm" />
      <div className="flex gap-2 flex-wrap">
        <button onClick={generate} disabled={aiLoading} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">{aiLoading?'...':'Generate with AI'}</button>
        <button onClick={personalize} disabled={aiLoading} className="px-4 py-2 border rounded-lg text-sm">Personalize</button>
        <button onClick={send} disabled={sending} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{sending?'Sending...':'Send'}</button>
        <button className="px-4 py-2 border rounded-lg text-sm">Save Draft</button>
      </div>
      {msg && <p className="text-sm text-zinc-600">{msg}</p>}
    </div>
  </div>
}
