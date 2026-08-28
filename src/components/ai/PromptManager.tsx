'use client'
import { useState, useEffect } from 'react'
export function PromptManager(){
  const [prompts,setPrompts]=useState<any[]>([])
  const [name,setName]=useState('Website Outreach')
  const [sys,setSys]=useState('You are a professional B2B outreach assistant. Do not invent business facts.')
  const [tmpl,setTmpl]=useState('Hi {{first_name}}, I noticed {{business_name}} in {{city}} ({{website}})...')
  const [out,setOut]=useState('')
  useEffect(()=>{ fetch('/api/ai/generate').catch(()=>{}) },[])
  async function gen(){
    const res=await fetch('/api/ai/generate',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: sys+"\n"+tmpl, variables:{ business_name:'ABC Dental', person_name:'John', city:'Miami', website:'abcdental.com', niche:'Dental', service:'Website + Local SEO' }})})
    const j=await res.json(); setOut(j.data?.text||JSON.stringify(j))
  }
  return <div className="space-y-4">
    <div className="grid gap-3">
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Template name" className="px-3 py-2 border rounded-lg text-sm" />
      <textarea value={sys} onChange={e=>setSys(e.target.value)} rows={2} placeholder="System instruction" className="px-3 py-2 border rounded-lg text-sm" />
      <textarea value={tmpl} onChange={e=>setTmpl(e.target.value)} rows={4} placeholder="Template with {{variables}}" className="px-3 py-2 border rounded-lg text-sm" />
      <button onClick={gen} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm w-fit">Generate with AI</button>
    </div>
    {out && <pre className="bg-zinc-50 p-4 rounded border text-sm whitespace-pre-wrap">{out}</pre>}
    <p className="text-xs text-zinc-500">Variables: {"{{business_name}} {{person_name}} {{position}} {{website}} {{niche}} {{location}} {{service}} {{user_instruction}}"} — stored in ai_prompts, FreeAIProvider does safe substitution, OpenAI provider calls API if AI_API_KEY set.</p>
  </div>
}
