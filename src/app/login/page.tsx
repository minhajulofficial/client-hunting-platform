'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
export default function Login(){
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState('')
  async function login(){
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: `${window.location.origin}/api/auth/callback` } })
    if (error) setMsg(error.message)
    setLoading(false)
  }
  return <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
    <div className="w-full max-w-sm bg-white rounded-xl border p-8 text-center">
      <h1 className="text-2xl font-bold">Welcome back</h1><p className="text-sm text-zinc-500 mt-1">Admin-only access via Google OAuth</p>
      <button onClick={login} disabled={loading} className="w-full mt-6 px-4 py-3 bg-zinc-900 text-white rounded-lg disabled:opacity-50">{loading?'Redirecting...':'Continue with Google'}</button>
      {msg && <p className="text-sm text-red-600 mt-3">{msg}</p>}
      <p className="text-xs text-zinc-400 mt-6">Set ADMIN_EMAILS in env to restrict access. If empty, any Google user is treated as admin (dev mode).</p>
    </div>
  </div>
}
