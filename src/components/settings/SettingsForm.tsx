'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'

interface Settings {
  site_name:string; default_country:string; timezone:string; ai_model:string;
  campaign_daily_limit:number; campaign_delay_ms:number;
  follow_up_day0:boolean; follow_up_day3:boolean; follow_up_day7:boolean;
  stop_on_replied:boolean; stop_on_unsubscribed:boolean;
}

const DEFAULTS: Settings = {
  site_name:'Client Hunting CRM', default_country:'US', timezone:'UTC', ai_model:'gpt-4o-mini',
  campaign_daily_limit:50, campaign_delay_ms:800,
  follow_up_day0:true, follow_up_day3:true, follow_up_day7:false,
  stop_on_replied:true, stop_on_unsubscribed:true,
}

export function SettingsForm(){
  const [s,setS]=useState<Settings>(DEFAULTS)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{
    fetch('/api/settings').then(r=>r.json()).then(j=>{
      if(j.success && j.data) setS(j.data)
    }).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  async function save(){
    setSaving(true); setError(''); setMsg('')
    try{
      const r=await fetch('/api/settings',{ method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(s) })
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Save failed')
      setMsg('Settings saved')
    }catch(e){ setError(e instanceof Error? e.message:'Save failed') }
    setSaving(false)
  }

  if(loading) return <p className="text-sm text-zinc-500">Loading settings…</p>

  return <div className="space-y-6">
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold">General</h3>
      <div className="grid md:grid-cols-3 gap-3">
        <div><label className="text-xs text-zinc-500">Site name</label><input value={s.site_name} onChange={e=>setS({...s,site_name:e.target.value})} className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-sm mt-1" /></div>
        <div><label className="text-xs text-zinc-500">Default country (ISO 2-letter)</label><input value={s.default_country} onChange={e=>setS({...s,default_country:e.target.value})} className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-sm mt-1" maxLength={2} /></div>
        <div><label className="text-xs text-zinc-500">Timezone</label><input value={s.timezone} onChange={e=>setS({...s,timezone:e.target.value})} className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-sm mt-1" /></div>
      </div>
    </Card>

    <Card className="p-4 space-y-3">
      <h3 className="font-semibold">AI</h3>
      <p className="text-xs text-zinc-500">API key is set via server environment variable AI_API_KEY (never exposed to browser).</p>
      <div><label className="text-xs text-zinc-500">Model</label><input value={s.ai_model} onChange={e=>setS({...s,ai_model:e.target.value})} className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-sm mt-1" placeholder="gpt-4o-mini" /></div>
    </Card>

    <Card className="p-4 space-y-3">
      <h3 className="font-semibold">Campaign</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className="text-xs text-zinc-500">Daily send limit</label><input type="number" min={1} max={500} value={s.campaign_daily_limit} onChange={e=>setS({...s,campaign_daily_limit:parseInt(e.target.value)||50})} className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-sm mt-1" /></div>
        <div><label className="text-xs text-zinc-500">Delay between emails (ms)</label><input type="number" min={500} max={30000} step={100} value={s.campaign_delay_ms} onChange={e=>setS({...s,campaign_delay_ms:parseInt(e.target.value)||800})} className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-sm mt-1" /></div>
      </div>
      <div className="flex flex-wrap gap-4 mt-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.follow_up_day0} onChange={e=>setS({...s,follow_up_day0:e.target.checked})} /> Day 0 follow-up</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.follow_up_day3} onChange={e=>setS({...s,follow_up_day3:e.target.checked})} /> Day 3 follow-up</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.follow_up_day7} onChange={e=>setS({...s,follow_up_day7:e.target.checked})} /> Day 7 follow-up</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.stop_on_replied} onChange={e=>setS({...s,stop_on_replied:e.target.checked})} /> Stop sequence on reply</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.stop_on_unsubscribed} onChange={e=>setS({...s,stop_on_unsubscribed:e.target.checked})} /> Stop on unsubscribe</label>
      </div>
    </Card>

    <div className="flex gap-3 items-center">
      <button onClick={save} disabled={saving} className="px-5 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{saving?'Saving…':'Save settings'}</button>
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  </div>
}
