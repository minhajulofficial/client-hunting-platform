'use client'
import { useState } from 'react'
import Papa from 'papaparse'
export function CsvImport({ projectId, onDone }: { projectId?: string; onDone?: ()=>void }){
  const [preview,setPreview]=useState<any[]>([])
  const [result,setResult]=useState<any>(null)
  const [loading,setLoading]=useState(false)
  function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return
    Papa.parse(file,{header:true, skipEmptyLines:true, complete:(res)=> setPreview(res.data.slice(0,5))})
  }
  async function doImport(){
    setLoading(true)
    // parse full file again
    const input=document.getElementById('csvfile') as HTMLInputElement
    const file=input.files?.[0]; if(!file){ setLoading(false); return}
    Papa.parse(file,{header:true, skipEmptyLines:true, complete: async (res)=>{
      const leads=res.data.map((r:any)=>({
        business_name: r.business_name||r.Business||r.name,
        email: r.email||r.Email,
        phone: r.phone||r.Phone,
        website: r.website||r.Website,
        city: r.city||r.City,
        country: r.country||r.Country,
        niche: r.niche||r.Niche,
        contact_first_name: r.first_name,
        contact_last_name: r.last_name,
        source:'csv'
      })).filter((l:any)=>l.business_name)
      const resp=await fetch('/api/leads/import',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ leads, projectId })})
      const j=await resp.json()
      setResult(j); setLoading(false); onDone?.()
    }})
  }
  return <div className="border rounded-lg p-4 bg-zinc-50">
    <h4 className="font-semibold text-sm">CSV Import → validation → preview → duplicate check → import</h4>
    <input id="csvfile" type="file" accept=".csv" onChange={onFile} className="mt-3 text-sm" />
    {preview.length>0 && <><p className="text-xs text-zinc-500 mt-2">Preview first 5 rows, duplicates checked server-side by email/phone/domain:</p><pre className="bg-white p-3 rounded border text-xs mt-2 overflow-auto max-h-40">{JSON.stringify(preview,null,2)}</pre><button onClick={doImport} disabled={loading} className="mt-3 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{loading?'Importing...':'Import to CRM'}</button></>}
    {result && <pre className="bg-white p-3 rounded border text-xs mt-3 overflow-auto">{JSON.stringify(result,null,2)}</pre>}
  </div>
}
