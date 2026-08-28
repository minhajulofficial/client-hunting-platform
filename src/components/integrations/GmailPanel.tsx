'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/states'

export function GmailPanel(){
  const [status,setStatus]=useState<'loading'|'connected'|'disconnected'|'not_configured'>('loading')
  const [detail,setDetail]=useState('')
  const [testing,setTesting]=useState(false)
  const [sending,setSending]=useState(false)
  const [result,setResult]=useState('')
  const [error,setError]=useState('')
  const [testTo,setTestTo]=useState('')

  const check=useCallback(async()=>{
    setStatus('loading'); setError('')
    try{
      const r=await fetch('/api/gmail/test')
      const j=await r.json()
      if(r.status===503){ setStatus('not_configured'); setDetail(j.error||''); return }
      if(!r.ok){ setStatus('disconnected'); setDetail(j.error||'Not connected'); return }
      setStatus('connected'); setDetail(j.data?.note||'Connected')
    }catch(e){ setStatus('disconnected'); setDetail(e instanceof Error? e.message:'check failed') }
  },[])
  useEffect(()=>{ check() },[check])

  async function testConn(){ setTesting(true); await check(); setTesting(false) }

  async function sendTest(){
    setSending(true); setResult(''); setError('')
    try{
      const r=await fetch('/api/gmail/test',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(testTo? { to:testTo } : {})})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Send failed')
      setResult(`Test email sent to ${j.data.to} ✓ (message id ${j.data.gmail_message_id})`)
    }catch(e){ setError(e instanceof Error? e.message:'Send failed') }
    setSending(false)
  }

  return <Card>
    <div className="flex justify-between items-start gap-2">
      <h3 className="font-semibold">Gmail</h3>
      {status==='loading' ? <Spinner label="checking" />
        : <Badge tone={status==='connected'?'green':status==='not_configured'?'yellow':'red'}>{status==='connected'?'Connected ✓':status==='not_configured'?'NOT CONFIGURED':'Not connected'}</Badge>}
    </div>
    <p className="text-sm text-zinc-500 mt-1">{detail}</p>

    {status==='not_configured' && <p className="text-xs text-amber-700 mt-2">Set <code className="bg-zinc-100 px-1 rounded">GOOGLE_CLIENT_ID</code>, <code className="bg-zinc-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code>, <code className="bg-zinc-100 px-1 rounded">GOOGLE_REDIRECT_URI</code> and enable the Gmail API.</p>}

    <div className="flex flex-wrap gap-2 mt-4">
      <a href="/api/integrations/gmail/auth" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">{status==='connected'?'Reconnect Gmail':'Connect Gmail'}</a>
      <button onClick={testConn} disabled={testing} className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm disabled:opacity-50">{testing?'Testing…':'Test Gmail Connection'}</button>
    </div>

    {status==='connected' && <div className="mt-4 pt-4 border-t border-zinc-200">
      <h4 className="text-sm font-semibold">Send a real test email</h4>
      <p className="text-xs text-zinc-500 mt-1">Sends through the Gmail API. Leave blank to send to your own account.</p>
      <div className="flex gap-2 mt-2">
        <input value={testTo} onChange={e=>setTestTo(e.target.value)} placeholder="you@example.com (optional)" className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
        <button onClick={sendTest} disabled={sending} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{sending?'Sending…':'Send Test Email'}</button>
      </div>
      {result && <p className="text-sm text-green-700 mt-2 break-all">{result}</p>}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>}
  </Card>
}
