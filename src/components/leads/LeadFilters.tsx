'use client'
import { useState } from 'react'
export function LeadFilters({ onSearch }: { onSearch: (q: Record<string,string>) => void }) {
  const [f,setF]=useState({ country:'', city:'', niche:'', status:'', email_status:'' })
  return <div className="flex flex-wrap gap-2">
    {(['country','city','niche','status','email_status'] as const).map(k=>(
      <input key={k} placeholder={k} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})} className="px-3 py-1.5 border rounded-full text-xs w-28" />
    ))}
    <button onClick={()=>onSearch(f)} className="px-4 py-1.5 bg-zinc-900 text-white rounded-full text-xs">Search</button>
    <button onClick={()=>{setF({country:'',city:'',niche:'',status:'',email_status:''}); onSearch({})}} className="px-3 py-1.5 border rounded-full text-xs">Clear</button>
  </div>
}
