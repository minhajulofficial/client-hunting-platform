'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LeadLike { id?:string; business_name?:string; contact_first_name?:string; city?:string; website?:string; niche?:string }

export function Composer({ to, lead }: { to?: string; lead?: LeadLike }){
  const router = useRouter()
  const [subject,setSubject]=useState('Quick idea for '+(lead?.business_name || 'your business'))
  const [body,setBody]=useState('Hi '+(lead?.contact_first_name || 'there')+',\n\nI came across '+(lead?.business_name || 'your business')+(lead?.city? ' in '+lead.city : '')+' and had one idea worth sharing.\n\nWould it help if I sent it over?')
  const [busy,setBusy]=useState<''|'send'|'generate'|'personalize'>('')
  const [msg,setMsg]=useState('')
  const [error,setError]=useState('')

  const leadVars: Record<string,string> = {
    business_name: lead?.business_name || '',
    first_name: lead?.contact_first_name || '',
    city: lead?.city || '',
    website: lead?.website || '',
    niche: lead?.niche || '',
  }

  async function call(path:string, payload:unknown, mode:'generate'|'personalize'){
    setBusy(mode); setError(''); setMsg('')
    try{
      const r=await fetch(path,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'AI request failed')
      setBody(j.data.text)
      setMsg(j.data.note ? j.data.note : 'Generated with '+j.data.provider+' ✓')
    }catch(e){ setError(e instanceof Error? e.message:'AI request failed') }
    setBusy('')
  }

  async function send(){
    if(!to){ setError('This lead has no email address'); return }
    if(!confirm('Send this email to '+to+'?')) return
    setBusy('send'); setError(''); setMsg('')
    try{
      const r=await fetch('/api/emails/send',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to, subject, body, leadId: lead?.id })})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Send failed')
      setMsg('Sent ✓ (Gmail id '+j.data.gmail_message_id+')')
      router.refresh()
    }catch(e){ setError(e instanceof Error? e.message:'Send failed') }
    setBusy('')
  }

  return <div className="space-y-3">
    <input value={to || ''} readOnly placeholder="No email address" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-50" />
    <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
    <textarea value={body} onChange={e=>setBody(e.target.value)} rows={7} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
    <div className="flex gap-2 flex-wrap">
      <button onClick={()=>call('/api/ai/generate',{ prompt: subject, variables: leadVars, leadId: lead?.id },'generate')} disabled={!!busy} className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm disabled:opacity-50">{busy==='generate'?'Generating…':'Generate with AI'}</button>
      <button onClick={()=>call('/api/ai/personalize',{ template: body, lead: leadVars, leadId: lead?.id },'personalize')} disabled={!!busy} className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm disabled:opacity-50">{busy==='personalize'?'Personalizing…':'Personalize'}</button>
      <button onClick={send} disabled={!!busy || !to} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{busy==='send'?'Sending…':'Send'}</button>
    </div>
    {msg && <p className="text-sm text-green-700">{msg}</p>}
    {error && <p className="text-sm text-red-600">{error}</p>}
    <p className="text-xs text-zinc-500">Sending requires Gmail to be connected. Emails containing unresolved variables such as <code className="bg-zinc-100 px-1 rounded">{'{{first_name}}'}</code> are rejected by the server.</p>
  </div>
}
