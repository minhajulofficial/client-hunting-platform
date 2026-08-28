'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/card'

export function ExtensionToken(){
  const [token,setToken]=useState('')
  const [expires,setExpires]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [copied,setCopied]=useState(false)

  async function generate(){
    setLoading(true); setError(''); setToken(''); setCopied(false)
    try{
      const r=await fetch('/api/extension/session',{ method:'POST' })
      const j=await r.json()
      if(!r.ok) throw new Error(j.error||'Failed to create session')
      setToken(j.data.token); setExpires(j.data.expires_at)
    }catch(e){ setError(e instanceof Error? e.message:'Failed') }
    setLoading(false)
  }

  async function copy(){
    try{ await navigator.clipboard.writeText(token); setCopied(true) }catch{ setError('Clipboard blocked — select the token manually') }
  }

  return <Card>
    <h3 className="font-semibold">Extension session</h3>
    <p className="text-sm text-zinc-500 mt-1">The extension normally connects by itself (press <b>Connect to CRM</b> in the popup while logged in here). Generate a token manually only for debugging.</p>
    <button onClick={generate} disabled={loading} className="mt-3 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm disabled:opacity-50">{loading?'Generating…':'Generate session token'}</button>
    {token && <div className="mt-3">
      <p className="text-xs text-zinc-500">Expires {new Date(expires).toLocaleString()}</p>
      <code className="block mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded text-xs break-all">{token}</code>
      <button onClick={copy} className="mt-2 px-3 py-1.5 border border-zinc-200 bg-white rounded-lg text-xs">{copied?'Copied ✓':'Copy'}</button>
    </div>}
    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    <p className="text-xs text-zinc-500 mt-3">Tokens are short-lived (7 days), stored server-side in <code className="bg-zinc-100 px-1 rounded">extension_sessions</code>, and expiry is enforced on every request.</p>
  </Card>
}
