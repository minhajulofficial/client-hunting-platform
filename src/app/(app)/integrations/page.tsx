import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
export default function Integrations(){
  return <AppShell><h1 className="text-2xl font-bold">Integrations</h1>
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card><h3 className="font-semibold">Gmail <Badge>OAuth 2.0</Badge></h3><p className="text-sm text-zinc-500 mt-1">Secure token storage in oauth_accounts, never exposed to client. Send, sync replies, thread matching.</p>
        <div className="flex gap-2 mt-3"><a href="/api/integrations/gmail" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">Connect Gmail</a><form action="/api/emails/sync" method="POST"><button className="px-4 py-2 border rounded-lg text-sm">Sync Replies</button></form></div>
        <p className="text-xs text-zinc-500 mt-3">Set GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI in Vercel env.</p>
      </Card>
      <Card><h3 className="font-semibold">Meta (Facebook / Instagram) <Badge tone="yellow">Official API only</Badge></h3><p className="text-sm text-zinc-500 mt-1">Where API unavailable, browser-assisted manual workflow — no CAPTCHA/bypass.</p><button className="mt-3 px-4 py-2 border rounded-lg text-sm">Configure Meta App</button></Card>
    </div>
    <Card className="mt-6"><h3 className="font-semibold">Supported Sources</h3><p className="text-sm text-zinc-500">google-search • google-maps • business-directories • website • facebook • instagram • linkedin • other — each via SourceAdapter at src/lib/sources/*</p></Card>
  </AppShell>
}
