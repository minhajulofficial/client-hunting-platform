'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/states'

interface Tpl { id:string; name:string; subject:string; body:string; niche?:string|null; service?:string|null }

const VARS = ['{{first_name}}','{{business_name}}','{{position}}','{{city}}','{{website}}','{{service}}']

export function TemplateManager(){
  const [items,setItems]=useState<Tpl[]>([])
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [okMsg,setOkMsg]=useState('')
  const [form,setForm]=useState({ name:'', subject:'Quick idea for {{business_name}}', body:'Hi {{first_name}},\n\nI came across {{business_name}} in {{city}} and had one idea about {{service}}.\n\nWorth a quick look?', service:'', niche:'' })

  const load=useCallback(async()=>{
    setLoading(true); setError('')
    try{
      const r=await fetch('/api/templates'); const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Failed to load templates')
      setItems(j.data||[])
    }catch(e){ setError(e instanceof Error? e.message:'Failed to load') }
    setLoading(false)
  },[])
  useEffect(()=>{ load() },[load])

  async function save(e: React.FormEvent){
    e.preventDefault(); setSaving(true); setError(''); setOkMsg('')
    try{
      const r=await fetch('/api/templates',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Save failed')
      setOkMsg('Template saved ✓'); await load()
    }catch(e){ setError(e instanceof Error? e.message:'Save failed') }
    setSaving(false)
  }

  async function remove(id:string){
    if(!confirm('Delete this template?')) return
    setError('')
    try{
      const r=await fetch('/api/templates?id='+id,{ method:'DELETE' })
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Delete failed')
      await load()
    }catch(e){ setError(e instanceof Error? e.message:'Delete failed') }
  }

  return <div className="grid lg:grid-cols-2 gap-6">
    <Card>
      <h3 className="font-semibold">New template</h3>
      <form onSubmit={save} className="space-y-2 mt-3">
        <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Template name" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
        <input required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Subject" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
        <textarea required rows={6} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-mono" />
        <div className="flex gap-2">
          <input value={form.service} onChange={e=>setForm({...form,service:e.target.value})} placeholder="Service" className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input value={form.niche} onChange={e=>setForm({...form,niche:e.target.value})} placeholder="Niche" className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
        </div>
        <div className="flex flex-wrap gap-1">{VARS.map(v=> <button type="button" key={v} onClick={()=>setForm({...form, body: form.body+' '+v})} className="px-2 py-1 border border-zinc-200 rounded text-xs">{v}</button>)}</div>
        <button disabled={saving} className="w-full px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{saving?'Saving…':'Save Template'}</button>
      </form>
      {okMsg && <p className="text-sm text-green-700 mt-2">{okMsg}</p>}
      {error && <div className="mt-3"><ErrorState message={error} /></div>}
      <p className="text-xs text-zinc-500 mt-3">Variables are replaced with real lead data before sending. A lead is never emailed with unresolved placeholders.</p>
    </Card>
    <div className="space-y-3">
      {loading ? <Card><Spinner label="Loading templates…" /></Card>
        : items.length===0 ? <EmptyState title="No templates yet" description="Create your first outreach template on the left. Templates are stored in your database and used by campaigns." />
        : items.map(t=> <Card key={t.id}>
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0"><h4 className="font-semibold text-sm truncate">{t.name}</h4><p className="text-xs text-zinc-500 truncate">{t.subject}</p></div>
              <button onClick={()=>remove(t.id)} className="px-2 py-1 border border-zinc-200 rounded text-xs shrink-0">Delete</button>
            </div>
            <pre className="bg-zinc-50 border border-zinc-200 rounded p-2 mt-2 text-xs whitespace-pre-wrap max-h-32 overflow-auto">{t.body}</pre>
          </Card>)}
    </div>
  </div>
}
