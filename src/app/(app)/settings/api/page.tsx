import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ApiSettings(){
  const rows = [
    { key:'NEXT_PUBLIC_SUPABASE_URL', set: !!process.env.NEXT_PUBLIC_SUPABASE_URL, note:'Public — safe in the browser bundle' },
    { key:'NEXT_PUBLIC_SUPABASE_ANON_KEY', set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, note:'Public — protected by Row Level Security' },
    { key:'SUPABASE_SERVICE_ROLE_KEY', set: !!process.env.SUPABASE_SERVICE_ROLE_KEY, note:'Server only — never sent to the client' },
    { key:'GOOGLE_CLIENT_ID', set: !!process.env.GOOGLE_CLIENT_ID, note:'Server only' },
    { key:'GOOGLE_CLIENT_SECRET', set: !!process.env.GOOGLE_CLIENT_SECRET, note:'Server only' },
    { key:'AI_API_KEY', set: !!process.env.AI_API_KEY, note:'Server only — optional, free mode without it' },
    { key:'EMAIL_VERIFIER_API_KEY', set: !!process.env.EMAIL_VERIFIER_API_KEY, note:'Server only — optional paid verifier' },
    { key:'META_APP_SECRET', set: !!process.env.META_APP_SECRET, note:'Server only — optional' },
  ]
  return <AppShell>
    <h1 className="text-2xl font-bold">API keys</h1>
    <p className="text-sm text-zinc-500 mt-1">Only presence is shown — values are never rendered or exposed to the extension.</p>
    <Card className="mt-6">
      <table className="w-full text-sm">
        <thead><tr className="text-zinc-500 border-b"><th className="text-left p-2">Variable</th><th className="text-left p-2">Status</th><th className="text-left p-2">Scope</th></tr></thead>
        <tbody>{rows.map(r=> <tr key={r.key} className="border-b last:border-0">
          <td className="p-2"><code className="text-xs">{r.key}</code></td>
          <td className="p-2"><Badge tone={r.set?'green':'yellow'}>{r.set?'Set ✓':'Not set'}</Badge></td>
          <td className="p-2 text-xs text-zinc-500">{r.note}</td>
        </tr>)}</tbody>
      </table>
    </Card>
  </AppShell>
}
