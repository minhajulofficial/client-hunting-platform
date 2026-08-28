'use client'
import { useEffect, useState } from 'react'
export function Notifications(){
  const [notes,setNotes]=useState<string[]>([])
  useEffect(()=>{
    // Poll activity_logs for new items - lightweight
    const id=setInterval(async()=>{
      try{
        const r=await fetch('/api/inbox'); const j=await r.json()
        if(j.data?.length) setNotes([`Inbox: ${j.data.length} threads`])
      }catch{}
    }, 30000)
    return ()=> clearInterval(id)
  },[])
  if(!notes.length) return null
  return <div className="fixed bottom-4 right-4 bg-zinc-900 text-white px-4 py-3 rounded-xl text-sm shadow-lg">{notes[0]}</div>
}
