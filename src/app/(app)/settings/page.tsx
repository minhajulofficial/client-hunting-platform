import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
export default function Settings(){
  return <AppShell><h1 className="text-2xl font-bold">Settings</h1><p className="text-sm text-zinc-500">General • AI • Gmail • Meta • Lead • Campaign — free-to-paid abstraction</p>
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card><h3 className="font-semibold">General</h3><p className="text-sm text-zinc-500">Site name, logo, timezone, default country/language</p><p className="text-xs mt-2">Default country used for phone verification & extension</p></Card>
      <Card><h3 className="font-semibold">Lead scoring <Badge tone="blue">New</Badge></h3><p className="text-sm text-zinc-500">Scoring: VERIFIED email 30 + VALID phone 15 + website 15 + social 10 + contact 5 + geo 5 + niche 5 + business domain 10 = 0-100 → HOT≥80 WARM≥50 COLD</p><p className="text-xs mt-2">Stored in lead_score, recomputed on verify/import</p></Card>
      <Card><h3 className="font-semibold">AI</h3><p className="text-sm text-zinc-500">Provider, API key (server-only), model, default prompts — FreeAIProvider vs OpenAIProvider</p></Card>
      <Card><h3 className="font-semibold">Campaign</h3><p className="text-sm text-zinc-500">Sending limits (rate-limit queue), follow-up rules Day0/3/7, unsubscribe handling, stop on REPLIED</p></Card>
    </div>
    <div className="flex gap-3 mt-6"><a href="/settings/api" className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm">API Keys (server-only)</a><a href="/settings/extension" className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm">Extension session</a></div>
  </AppShell>
}
