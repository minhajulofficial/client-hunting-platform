import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { ExtensionToken } from '@/components/settings/ExtensionToken'

export default function ExtensionSettings(){
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  return <AppShell>
    <h1 className="text-2xl font-bold">Extension</h1>
    <p className="text-sm text-zinc-500 mt-1">Install the Chrome extension and point it at this CRM.</p>
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card>
        <h3 className="font-semibold">Install</h3>
        <ol className="text-sm text-zinc-600 mt-3 space-y-1 list-decimal ml-5">
          <li>Open <code className="bg-zinc-100 px-1 rounded">chrome://extensions</code></li>
          <li>Enable <b>Developer mode</b></li>
          <li>Click <b>Load unpacked</b> and select the <code className="bg-zinc-100 px-1 rounded">extension/</code> folder</li>
          <li>Open the popup → <b>CRM URL</b> → paste <code className="bg-zinc-100 px-1 rounded break-all">{appUrl || 'your CRM URL'}</code></li>
          <li>Press <b>Connect to CRM</b>, then <b>Test Connection</b></li>
        </ol>
        <p className="text-xs text-zinc-500 mt-3">Required permissions: storage (session), activeTab/tabs + scripting (read the page you open). No background browsing, no bypassing of logins or CAPTCHAs.</p>
      </Card>
      <ExtensionToken />
    </div>
  </AppShell>
}
