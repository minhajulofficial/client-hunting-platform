'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'

interface ProjectOpt { id:string; name:string }

export function CsvImport({ projects }: { projects: ProjectOpt[] }){
  const router = useRouter()
  const [file,setFile]=useState<File|null>(null)
  const [preview,setPreview]=useState<Record<string,string>[]>([])
  const [projectId,setProjectId]=useState('')
  const [busy,setBusy]=useState(false)
  const [result,setResult]=useState('')
  const [error,setError]=useState('')

  function pick(e: React.ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0] || null
    setFile(f); setPreview([]); setResult(''); setError('')
    if(!f) return
    Papa.parse<Record<string,string>>(f,{ header:true, skipEmptyLines:true, preview:5,
      complete: res => setPreview(res.data),
      error: err => setError('Could not read the file: '+err.message)
    })
  }

  function mapRow(r: Record<string,string>){
    const get=(...keys:string[])=>{ for(const k of keys){ const v=r[k] ?? r[k.toLowerCase()] ?? r[k.toUpperCase()]; if(v) return String(v).trim() } return undefined }
    return {
      business_name: get('business_name','Business','business','name','Name','Company','company'),
      email: get('email','Email','E-mail'),
      phone: get('phone','Phone','Telephone'),
      website: get('website','Website','url','URL'),
      city: get('city','City'),
      state: get('state','State','region'),
      country: get('country','Country'),
      niche: get('niche','Niche','industry','Industry'),
      contact_first_name: get('first_name','First Name','firstname'),
      contact_last_name: get('last_name','Last Name','lastname'),
      contact_position: get('position','Position','title','Title'),
      source: 'csv',
    }
  }

  async function run(){
    if(!file){ setError('Choose a CSV file first'); return }
    setBusy(true); setError(''); setResult('')
    Papa.parse<Record<string,string>>(file,{ header:true, skipEmptyLines:true,
      complete: async res => {
        const leads = res.data.map(mapRow).filter(l=> l.business_name && l.business_name.length>=2)
        if(leads.length===0){ setError('No rows with a business_name column were found. Required header: business_name'); setBusy(false); return }
        try{
          const r=await fetch('/api/leads/import',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ leads, projectId: projectId || null })})
          const j=await r.json()
          if(!r.ok) throw new Error(j.error||'Import failed')
          setResult(`Received ${j.data.received} · imported ${j.data.imported} · duplicates ${j.data.duplicates} · failed ${j.data.failed}`)
          router.refresh()
        }catch(e){ setError(e instanceof Error? e.message:'Import failed') }
        setBusy(false)
      },
      error: err => { setError('Could not read the file: '+err.message); setBusy(false) }
    })
  }

  return <div className="space-y-3">
    <div>
      <h3 className="font-semibold text-sm">Import CSV</h3>
      <p className="text-xs text-zinc-500 mt-1">Required header: <code className="bg-zinc-100 px-1 rounded">business_name</code>. Optional: email, phone, website, city, state, country, niche, first_name, last_name, position.</p>
    </div>
    <div className="flex flex-wrap gap-2 items-center">
      <input type="file" accept=".csv,text/csv" onChange={pick} className="text-sm" />
      <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-white">
        <option value="">No project</option>
        {projects.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>

    {preview.length>0 && <div>
      <p className="text-xs text-zinc-500">Preview — first {preview.length} row(s). The server validates, verifies and de-duplicates every row.</p>
      <pre className="bg-zinc-50 border border-zinc-200 p-2 rounded mt-1 text-xs overflow-auto max-h-40">{JSON.stringify(preview.map(mapRow),null,2)}</pre>
      <button onClick={run} disabled={busy} className="mt-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{busy?'Importing…':'Import to CRM'}</button>
    </div>}

    {result && <p className="text-sm text-green-700">{result}</p>}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
}
