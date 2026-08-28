import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GmailPanel } from '@/components/integrations/GmailPanel'
import { getSupportedSources } from '@/lib/sources/registry'

export default function Integrations(){
  const aiConfigured = !!process.env.AI_API_KEY
  const sources = getSupportedSources()
  return <AppShell>
    <h1 className="text-2xl font-bold">Integrations</h1>
    <p className="text-sm text-zinc-500 mt-1">Secrets stay on the server. The extension never receives API keys or OAuth tokens.</p>

    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <GmailPanel />

      <Card>
        <div className="flex justify-between items-start"><h3 className="font-semibold">AI provider</h3><Badge tone={aiConfigured?'green':'yellow'}>{aiConfigured?'Configured ✓':'Free mode'}</Badge></div>
        <p className="text-sm text-zinc-500 mt-1">{aiConfigured ? `OpenAI provider active (${process.env.AI_MODEL || 'gpt-4o-mini'}).` : 'AI_API_KEY is not set. Generation uses safe variable substitution only — it never invents business facts.'}</p>
        <a href="/ai" className="inline-block mt-3 px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm">Open AI workspace</a>
      </Card>

      <Card>
        <div className="flex justify-between items-start"><h3 className="font-semibold">Meta (Facebook / Instagram)</h3><Badge tone="yellow">Official API only</Badge></div>
        <p className="text-sm text-zinc-500 mt-1">Messaging requires an approved Meta app with the relevant permissions. Until that is configured this integration reports NOT CONFIGURED — there is no unauthorised DM or scraping path.</p>
        <p className="text-xs text-zinc-500 mt-2">Where no API exists, use the browser-assisted flow: open the profile and contact it manually.</p>
      </Card>

      <Card>
        <h3 className="font-semibold">Source adapters</h3>
        <ul className="mt-3 space-y-1 text-sm">{sources.map(s=>
          <li key={s.id} className="flex justify-between gap-2"><span>{s.name}</span><Badge tone={s.id==='website'?'green':'default'}>{s.id==='website'?'Implemented ✓':'Adapter registered'}</Badge></li>)}
        </ul>
        <p className="text-xs text-zinc-500 mt-3">Only the website adapter performs live extraction today (public contact details on the page you open). Others are registered interfaces awaiting official API access.</p>
      </Card>
    </div>
  </AppShell>
}
