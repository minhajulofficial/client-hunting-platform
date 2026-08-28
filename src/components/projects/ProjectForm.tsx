'use client'
import { useState } from 'react'
export function ProjectForm({ onCreated }: { onCreated?: ()=>void }){
  const [name,setName]=useState(''); const [country,setCountry]=useState('USA'); const [niche,setNiche]=useState('Dental Clinic'); const [city,setCity]=useState('Miami'); const [loading,setLoading]=useState(false); const [msg,setMsg]=useState('')
  async function create(e: React.FormEvent){
    e.preventDefault(); setLoading(true); setMsg('')
    const res=await fetch('/api/projects',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, country, cities:[city], niche, status:'active' })})
    const j=await res.json(); setLoading(false)
    if(j.success){ setMsg('Created ✓'); setName(''); onCreated?.(); location.reload() } else setMsg('Error: '+(j.error||'' ))
  }
  return <form onSubmit={create} className="border border-zinc-200 bg-white rounded-xl p-5 space-y-3">
    <h3 className="font-semibold">New Project</h3>
    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Project name (USA Dental Outreach)" required className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
    <div className="grid grid-cols-3 gap-2">
      <input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country" className="px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
      <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City" className="px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
      <input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Niche" className="px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
    </div>
    <button disabled={loading} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{loading?'Creating...':'Create Project'}</button>
    {msg && <p className="text-sm text-zinc-600">{msg}</p>}
  </form>
}
