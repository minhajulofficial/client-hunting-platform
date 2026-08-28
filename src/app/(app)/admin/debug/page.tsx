import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
export default function Debug(){
  const env={
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    AI_API_KEY: !!process.env.AI_API_KEY,
  }
  return <AppShell>
    <h1 className="text-2xl font-bold">Admin Debug</h1><p className="text-sm text-zinc-500">Spec §51 - every component testable</p>
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card><h3 className="font-semibold">Environment</h3><pre className="bg-zinc-50 p-3 rounded border text-xs mt-2 overflow-auto">{JSON.stringify(env,null,2)}</pre><p className="text-xs text-zinc-500 mt-2">All keys server-side only, never exposed to extension bundle.</p></Card>
      <Card><h3 className="font-semibold">Tests</h3><div className="space-y-2 mt-3">
        <a href="/api/health" target="_blank" className="block px-3 py-2 border border-zinc-200 bg-white rounded-lg text-sm">Test API (GET /api/health)</a>
        <a href="/api/extension/health" target="_blank" className="block px-3 py-2 border border-zinc-200 bg-white rounded-lg text-sm">Test Extension API</a>
        <a href="/api/integrations/gmail" target="_blank" className="block px-3 py-2 border border-zinc-200 bg-white rounded-lg text-sm">Test Gmail</a>
        <form action="/api/emails/sync" method="POST"><button className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg text-sm">Test Gmail Sync (POST)</button></form>
      </div></Card>
    </div>
    <Card className="mt-6"><h3 className="font-semibold">Queue & Extension</h3><p className="text-sm text-zinc-500">Extension: check popup → Diagnostics → Test API / Test Authentication. Queue: campaign_recipients status QUEUED→SENT.</p></Card>
  </AppShell>
}
