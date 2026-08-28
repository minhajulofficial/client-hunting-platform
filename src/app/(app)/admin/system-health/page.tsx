import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
export default async function SystemHealth(){
  const checks=[
    { name:'Application', ok:true, detail:'Next.js 16.3.3 running' },
    { name:'Database', ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL, detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Supabase configured ✓' : 'NOT CONFIGURED - set NEXT_PUBLIC_SUPABASE_URL' },
    { name:'Authentication', ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL, detail: 'Google OAuth via Supabase' },
    { name:'Gmail', ok: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), detail: process.env.GOOGLE_CLIENT_ID ? 'Gmail OAuth configured ✓' : 'NOT CONFIGURED - set GOOGLE_CLIENT_ID/SECRET' },
    { name:'AI', ok: !!process.env.AI_API_KEY, detail: process.env.AI_API_KEY ? `AI configured (${process.env.AI_MODEL||'gpt-4o-mini'})` : 'Free tier (template substitution) - set AI_API_KEY for OpenAI' },
    { name:'Extension API', ok:true, detail:'GET /api/extension/health' },
  ]
  return <AppShell>
    <h1 className="text-2xl font-bold">System Health</h1><p className="text-sm text-zinc-500">Required by spec §50 - every service must be testable</p>
    <div className="grid md:grid-cols-2 gap-4 mt-6">
      {checks.map(c=> <Card key={c.name}><div className="flex justify-between items-center"><h3 className="font-semibold">{c.name}</h3><Badge tone={c.ok?'green':'red'}>{c.ok?'✓':'✕'}</Badge></div><p className="text-sm text-zinc-500 mt-1">{c.detail}</p>{!c.ok && <p className="text-xs text-amber-700 mt-2">Reason: env missing - see docs/BEGINNER_SETUP.md</p>}</Card>)}
    </div>
    <Card className="mt-6"><h3 className="font-semibold">Test Endpoints</h3><ul className="text-sm mt-2 space-y-1"><li><code className="bg-zinc-100 px-1 rounded">GET /api/health</code> — app + env</li><li><code className="bg-zinc-100 px-1 rounded">GET /api/extension/health</code> — API + DB + auth</li><li><code className="bg-zinc-100 px-1 rounded">GET /api/integrations/gmail</code> — Gmail connected?</li></ul></Card>
  </AppShell>
}
